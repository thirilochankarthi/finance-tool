import streamlit as st
import json
import pandas as pd
import PyPDF2
import io
from groq import Groq
from supabase import create_client, Client
import os
from typing import Dict, Any, List
import uuid
from datetime import datetime
import openpyxl

# Configuration
st.set_page_config(
    page_title="AI Database Chat Agent",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better UI
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .chat-message {
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border-left: 4px solid #667eea;
    }
    
    .user-message {
        background-color: #f0f2f6;
        border-left-color: #667eea;
    }
    
    .ai-message {
        background-color: #rgb(38, 39, 48);
        border-left-color: #4CAF50;
    }
    
    .json-editor {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 1rem;
    }
    
    .file-upload-area {
        border: 2px dashed #667eea;
        border-radius: 10px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class DatabaseChatAgent:
    def __init__(self):
        self.groq_client = None
        self.supabase_client = None
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize Groq and Supabase clients"""
        try:
            # Initialize Groq client
            if 'groq_api_key' in st.session_state and st.session_state.groq_api_key:
                self.groq_client = Groq(api_key=st.session_state.groq_api_key)
            
            # Initialize Supabase client
            if ('supabase_url' in st.session_state and 'supabase_key' in st.session_state and 
                st.session_state.supabase_url and st.session_state.supabase_key):
                self.supabase_client = create_client(
                    st.session_state.supabase_url,
                    st.session_state.supabase_key
                )
        except Exception as e:
            st.error(f"Error setting up clients: {str(e)}")
    
    def extract_pdf_text(self, pdf_file) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            st.error(f"Error extracting PDF text: {str(e)}")
            return ""
    
    def extract_excel_data(self, excel_file) -> Dict[str, Any]:
        """Extract data from Excel file"""
        try:
            # Read all sheets
            excel_data = pd.read_excel(excel_file, sheet_name=None)
            result = {}
            
            for sheet_name, df in excel_data.items():
                # Convert DataFrame to JSON-serializable format
                sheet_data = {
                    "columns": df.columns.tolist(),
                    "data": df.fillna("").values.tolist(),
                    "shape": df.shape,
                    "summary": {
                        "total_rows": len(df),
                        "total_columns": len(df.columns),
                        "column_types": df.dtypes.astype(str).to_dict()
                    }
                }
                result[sheet_name] = sheet_data
            
            return result
        except Exception as e:
            st.error(f"Error extracting Excel data: {str(e)}")
            return {}
    
    def extract_csv_data(self, csv_file) -> Dict[str, Any]:
        """Extract data from CSV file"""
        try:
            df = pd.read_csv(csv_file)
            return {
                "columns": df.columns.tolist(),
                "data": df.fillna("").values.tolist(),
                "shape": df.shape,
                "summary": {
                    "total_rows": len(df),
                    "total_columns": len(df.columns),
                    "column_types": df.dtypes.astype(str).to_dict()
                }
            }
        except Exception as e:
            st.error(f"Error extracting CSV data: {str(e)}")
            return {}
    
    def process_uploaded_file(self, uploaded_file) -> Dict[str, Any]:
        """Process uploaded file and extract structured data"""
        file_extension = uploaded_file.name.split('.')[-1].lower()
        
        extracted_data = {
            "filename": uploaded_file.name,
            "file_type": file_extension,
            "upload_timestamp": datetime.now().isoformat(),
            "file_id": str(uuid.uuid4()),
            "content": {}
        }
        
        if file_extension == 'pdf':
            text_content = self.extract_pdf_text(uploaded_file)
            extracted_data["content"] = {
                "text": text_content,
                "word_count": len(text_content.split()),
                "character_count": len(text_content)
            }
        
        elif file_extension in ['xlsx', 'xls']:
            excel_data = self.extract_excel_data(uploaded_file)
            extracted_data["content"] = excel_data
        
        elif file_extension == 'csv':
            csv_data = self.extract_csv_data(uploaded_file)
            extracted_data["content"] = csv_data
        
        return extracted_data
    
    def get_database_schema(self) -> Dict[str, Any]:
        """Get database schema information"""
        if not self.supabase_client:
            return {"error": "Supabase client not initialized"}
        
        try:
            # This is a simplified schema retrieval
            # In a real implementation, you'd query the information_schema
            response = self.supabase_client.table('information_schema.tables').select('*').execute()
            return {"tables": response.data}
        except Exception as e:
            return {"error": f"Error getting schema: {str(e)}"}
    
    def execute_database_query(self, query_type: str, table_name: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute database operations"""
        if not self.supabase_client:
            return {"error": "Supabase client not initialized"}
        
        try:
            if query_type == "select":
                response = self.supabase_client.table(table_name).select('*').execute()
                return {"success": True, "data": response.data}
            
            elif query_type == "insert" and data:
                response = self.supabase_client.table(table_name).insert(data).execute()
                return {"success": True, "data": response.data}
            
            elif query_type == "update" and data:
                # Assuming data has an 'id' field for updating
                response = self.supabase_client.table(table_name).update(data).eq('id', data.get('id')).execute()
                return {"success": True, "data": response.data}
            
            elif query_type == "delete" and data:
                response = self.supabase_client.table(table_name).delete().eq('id', data.get('id')).execute()
                return {"success": True, "data": response.data}
            
            else:
                return {"error": "Invalid query type or missing data"}
        
        except Exception as e:
            return {"error": f"Database operation failed: {str(e)}"}
    
    def chat_with_ai(self, message: str, context: Dict[str, Any] = None) -> str:
        """Chat with AI using Groq API"""
        if not self.groq_client:
            return "Error: Groq client not initialized. Please check your API key."
        
        try:
            # Prepare system message with context
            system_message = """You are an AI database assistant with full access to the user's Supabase database. 
            You can help users:
            1. Query and retrieve data from their database
            2. Modify, insert, or delete data
            3. Analyze uploaded files (PDF, Excel, CSV)
            4. Convert file data to structured JSON
            5. Suggest database operations based on user requests
            
            Always be helpful and provide clear explanations of what operations you're performing.
            """
            
            if context:
                system_message += f"\n\nCurrent context: {json.dumps(context, indent=2)}"
            
            # Make API call to Groq
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": message}
                ],
                model="llama3-8b-8192",  # You can change this to other available models
                temperature=0.7,
                max_tokens=1000
            )
            
            return chat_completion.choices[0].message.content
        
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"

def main():
    st.markdown("""
    <div class="main-header">
        <h1>🤖 AI Database Chat Agent</h1>
        <p>Chat with your data • Upload files • Manage your Supabase database</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Initialize session state
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'extracted_data' not in st.session_state:
        st.session_state.extracted_data = None
    if 'json_editor_data' not in st.session_state:
        st.session_state.json_editor_data = None
    
    # Initialize the chat agent
    agent = DatabaseChatAgent()
    
    # Sidebar for configuration
    with st.sidebar:
        st.header("🔧 Configuration")
        
        # API Keys
        st.subheader("API Keys")
        groq_api_key = st.text_input("Groq API Key", type="password", key="groq_api_key")
        
        st.subheader("Supabase Configuration")
        supabase_url = st.text_input("Supabase URL", key="supabase_url")
        supabase_key = st.text_input("Supabase Key", type="password", key="supabase_key")
        
        if st.button("Connect to Services"):
            agent.setup_clients()
            st.success("Services connected!")
        
        # File Upload Section
        st.header("📁 File Upload")
        uploaded_file = st.file_uploader(
            "Upload files (PDF, Excel, CSV)",
            type=['pdf', 'xlsx', 'xls', 'csv'],
            help="Upload files to extract and analyze data"
        )
        
        if uploaded_file is not None:
            if st.button("Process File"):
                with st.spinner("Processing file..."):
                    extracted_data = agent.process_uploaded_file(uploaded_file)
                    st.session_state.extracted_data = extracted_data
                    st.session_state.json_editor_data = json.dumps(extracted_data, indent=2)
                    st.success(f"File {uploaded_file.name} processed successfully!")
    
    # Main chat interface
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("💬 Chat Interface")
        
        # Display chat messages
        for message in st.session_state.messages:
            if message["role"] == "user":
                st.markdown(f"""
                <div class="chat-message user-message">
                    <strong>You:</strong> {message["content"]}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="chat-message ai-message">
                    <strong>AI:</strong> {message["content"]}
                </div>
                """, unsafe_allow_html=True)
        
        # Chat input
        user_input = st.text_input("Type your message:", key="chat_input")
        
        col_send, col_clear = st.columns([1, 1])
        
        with col_send:
            if st.button("Send", use_container_width=True):
                if user_input:
                    # Add user message
                    st.session_state.messages.append({"role": "user", "content": user_input})
                    
                    # Prepare context
                    context = {}
                    if st.session_state.extracted_data:
                        context["extracted_data"] = st.session_state.extracted_data
                    
                    # Get AI response
                    ai_response = agent.chat_with_ai(user_input, context)
                    st.session_state.messages.append({"role": "assistant", "content": ai_response})
                    
                    st.rerun()
        
        with col_clear:
            if st.button("Clear Chat", use_container_width=True):
                st.session_state.messages = []
                st.rerun()
    
    with col2:
        st.header("🔧 JSON Editor")
        
        if st.session_state.json_editor_data:
            st.subheader("Extracted Data")
            
            # JSON editor
            edited_json = st.text_area(
                "Edit JSON data:",
                value=st.session_state.json_editor_data,
                height=400,
                help="Modify the extracted data as needed"
            )
            
            col_update, col_save = st.columns(2)
            
            with col_update:
                if st.button("Update JSON"):
                    try:
                        # Validate JSON
                        parsed_json = json.loads(edited_json)
                        st.session_state.json_editor_data = edited_json
                        st.session_state.extracted_data = parsed_json
                        st.success("JSON updated successfully!")
                    except json.JSONDecodeError as e:
                        st.error(f"Invalid JSON: {str(e)}")
            
            with col_save:
                if st.button("Save to Database"):
                    if agent.supabase_client:
                        try:
                            # This is a simplified save operation
                            # You'd need to specify the table and structure
                            st.info("Database save functionality needs to be configured for your specific schema")
                        except Exception as e:
                            st.error(f"Error saving to database: {str(e)}")
                    else:
                        st.error("Supabase client not connected")
        
        else:
            st.info("Upload a file to see extracted data here")
        
        # Database operations
        st.header("🗄️ Database Operations")
        
        operation = st.selectbox("Select Operation", ["Select", "Insert", "Update", "Delete"])
        table_name = st.text_input("Table Name")
        
        if operation != "Select":
            data_input = st.text_area("Data (JSON format)")
        
        if st.button("Execute Operation"):
            if agent.supabase_client and table_name:
                try:
                    data = json.loads(data_input) if operation != "Select" and data_input else None
                    result = agent.execute_database_query(operation.lower(), table_name, data)
                    
                    if result.get("success"):
                        st.success("Operation completed successfully!")
                        st.json(result.get("data", {}))
                    else:
                        st.error(result.get("error", "Unknown error"))
                except Exception as e:
                    st.error(f"Error: {str(e)}")
            else:
                st.error("Please configure Supabase connection and provide table name")

if __name__ == "__main__":
    # Install required packages message
    st.markdown("""
    ### 📦 Required Packages
    Make sure to install the following packages:
    ```bash
    pip install streamlit groq supabase pandas PyPDF2 openpyxl
    ```
    """)
    
    main()