import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Send, Trash2, Download, Database, MessageSquare, FileText } from "lucide-react";
import { supabase, groq_api_key } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  filename: string;
  file_type: string;
  upload_timestamp: string;
  file_id: string;
  content: any;
}

// Define available tables for type safety
type AvailableTables = "budget_items" | "cash_flow_items" | "invoices" | "investments" | "financial_data";

const AgenticControl = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [jsonData, setJsonData] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [databaseOperation, setDatabaseOperation] = useState("select");
  const [tableName, setTableName] = useState<AvailableTables>("budget_items");
  const [operationData, setOperationData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractPdfText = async (file: File): Promise<string> => {
    // For PDF extraction, we'll use a simple text extraction
    // In a real implementation, you'd use pdf-parse or similar
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a placeholder - you'd need proper PDF parsing
        resolve("PDF content extracted (placeholder) - In a real implementation, you would use pdf-parse library to extract actual text content from the PDF file.");
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const extractExcelData = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const result: any = {};
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0] as string[];
              const rows = jsonData.slice(1) as any[][];
              
              result[sheetName] = {
                columns: headers,
                data: rows,
                shape: [rows.length, headers.length],
                summary: {
                  total_rows: rows.length,
                  total_columns: headers.length,
                  column_types: headers.reduce((acc, header) => ({ ...acc, [header]: "string" }), {})
                }
              };
            }
          });
          
          resolve(result);
        } catch (error) {
          resolve({
            error: "Failed to parse Excel file",
            columns: ["Error"],
            data: [["Failed to parse Excel file"]],
            shape: [1, 1],
            summary: {
              total_rows: 1,
              total_columns: 1,
              column_types: { Error: "string" }
            }
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const extractCsvData = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            resolve({
              columns: ["No Data"],
              data: [],
              shape: [0, 1],
              summary: {
                total_rows: 0,
                total_columns: 1,
                column_types: { "No Data": "string" }
              }
            });
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim());
          const data = lines.slice(1).map(line => 
            line.split(',').map(cell => cell.trim())
          );
          
          resolve({
            columns: headers,
            data: data,
            shape: [data.length, headers.length],
            summary: {
              total_rows: data.length,
              total_columns: headers.length,
              column_types: headers.reduce((acc, header) => ({ ...acc, [header]: "string" }), {})
            }
          });
        } catch (error) {
          resolve({
            error: "Failed to parse CSV file",
            columns: ["Error"],
            data: [["Failed to parse CSV file"]],
            shape: [1, 1],
            summary: {
              total_rows: 1,
              total_columns: 1,
              column_types: { Error: "string" }
            }
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const processUploadedFile = async (file: File): Promise<ExtractedData> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    const extractedData: ExtractedData = {
      filename: file.name,
      file_type: fileExtension || "",
      upload_timestamp: new Date().toISOString(),
      file_id: crypto.randomUUID(),
      content: {}
    };

    try {
      if (fileExtension === 'pdf') {
        const textContent = await extractPdfText(file);
        extractedData.content = {
          text: textContent,
          word_count: textContent.split(' ').length,
          character_count: textContent.length
        };
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        const excelData = await extractExcelData(file);
        extractedData.content = excelData;
      } else if (fileExtension === 'csv') {
        const csvData = await extractCsvData(file);
        extractedData.content = csvData;
      }
    } catch (error) {
      toast.error(`Error processing file: ${error}`);
    }

    return extractedData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const processedData = await processUploadedFile(file);
      setExtractedData(processedData);
      setJsonData(JSON.stringify(processedData, null, 2));
      toast.success(`File ${file.name} processed successfully!`);
    } catch (error) {
      toast.error("Error processing file");
    } finally {
      setIsProcessing(false);
    }
  };

  const chatWithAI = async (message: string, context?: any): Promise<string> => {
    if (!groq_api_key) {
      return "Error: Groq API key not configured. Please check your API key in the client configuration.";
    }

    try {
      // Get current user data for context
      const currentUser = user;
      if (!currentUser) {
        return "Error: User not authenticated. Please log in to use the AI assistant.";
      }

      // Prepare system message with database context (without sensitive data)
      let systemMessage = `You are a helpful AI financial assistant that can work with the user's database and JSON data. 

IMPORTANT INSTRUCTIONS:
- Provide clear, structured responses in plain English
- Do NOT use markdown formatting (no **, *, +, or other markdown symbols)
- Do NOT show SQL queries or technical database commands
- Give actionable insights and recommendations
- Use clear headings and bullet points with plain text
- Be conversational and helpful
- If you need to perform database operations, explain what you would do in simple terms
- Format responses with clear sections and easy-to-read text
- You can read and use JSON data from the JSON Editor to perform database operations

CAPABILITIES:
1. Analyze financial data and provide insights
2. Help with budget planning and tracking
3. Process uploaded files (PDF, Excel, CSV)
4. Suggest financial improvements
5. Answer questions about spending patterns
6. Provide recommendations based on data
7. Read JSON data from the JSON Editor and perform database operations
8. Create, update, delete, and insert records based on JSON content

DATABASE TABLES AVAILABLE:
- Budget Items: Track income and expenses
- Cash Flow: Monitor money flow
- Invoices: Manage billing
- Investments: Track investment portfolio
- Financial Data: General financial records

JSON EDITOR INTEGRATION:
- You can read the current JSON data in the JSON Editor
- Use this data to perform database operations when users request create/update/delete/insert
- Parse JSON arrays to insert multiple records
- Validate JSON structure before database operations
- Provide feedback on JSON parsing and database operations

RESPONSE FORMAT:
- Use clear headings without special symbols
- Provide actionable advice in plain text
- Be specific and helpful
- Avoid technical jargon
- Focus on user benefits
- Use simple bullet points with dashes (-) or numbers
- Keep responses clean and readable

EXAMPLE FORMAT:
"Here's what I found in your budget:

Budget Summary:
- Total budgeted: $X
- Total actual: $Y
- Variance: $Z

Recent Items:
- Groceries: $200 budgeted, $180 actual
- Rent: $1500 budgeted, $1500 actual

Recommendations:
- Consider reducing grocery spending
- Your rent is on track"`;

      if (context && context.extracted_data) {
        systemMessage += `\n\nCURRENT FILE CONTEXT:
- Filename: ${context.extracted_data.filename}
- File Type: ${context.extracted_data.file_type}
- Upload Time: ${context.extracted_data.upload_timestamp}
- File Content: ${JSON.stringify(context.extracted_data.content, null, 2)}`;
      }

      // Add JSON Editor data to context if available
      if (jsonData && jsonData.trim()) {
        try {
          const parsedJson = JSON.parse(jsonData);
          systemMessage += `\n\nJSON EDITOR DATA AVAILABLE:
${JSON.stringify(parsedJson, null, 2)}

You can use this JSON data to perform database operations when requested.`;
        } catch (jsonError) {
          systemMessage += `\n\nJSON EDITOR DATA:
- JSON data is present but may be invalid or malformed
- Please inform the user if JSON needs to be corrected before database operations`;
        }
      }

      // Add recent database state for context (without sensitive user data)
      try {
        const { data: recentBudgetItems } = await supabase
          .from('budget_items')
          .select('category, budgeted, actual, type, created_at')
          .eq('user_id', currentUser.id)
          .limit(5);

        if (recentBudgetItems && recentBudgetItems.length > 0) {
          systemMessage += `\n\nRECENT BUDGET DATA (last 5 items):
${JSON.stringify(recentBudgetItems, null, 2)}`;
        }
      } catch (dbError) {
        console.log('Could not fetch recent data for context:', dbError);
      }
      
      // Make API call to Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groq_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return `Error communicating with AI: ${error}. Please check your API key and try again.`;
    }
  };

  // New function to handle AI-initiated database operations
  const handleAIDatabaseOperation = async (operation: string, table: AvailableTables, data?: any) => {
    try {
      let result;
      
      switch (operation.toLowerCase()) {
        case "select":
          const { data: selectData, error: selectError } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user?.id);
          
          if (selectError) throw selectError;
          result = { success: true, data: selectData };
          break;
          
        case "insert":
          if (!data) {
            throw new Error("No data provided for insert operation");
          }
          
          console.log('Attempting to insert data:', data);
          console.log('Table:', table);
          
          let insertResult;
          let insertError;
          
          // Handle array of records
          if (Array.isArray(data)) {
            const insertDataArray = data.map(item => ({ ...item, user_id: user?.id }));
            console.log('Inserting array of records:', insertDataArray);
            
            const { data: arrayResult, error: arrayError } = await supabase
              .from(table)
              .insert(insertDataArray)
              .select();
            
            insertResult = arrayResult;
            insertError = arrayError;
          } else {
            // Handle single record
            const insertData = { ...data, user_id: user?.id };
            console.log('Inserting single record:', insertData);
            
            const { data: singleResult, error: singleError } = await supabase
              .from(table)
              .insert(insertData)
              .select();
            
            insertResult = singleResult;
            insertError = singleError;
          }
          
          if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw insertError;
          }
          result = { success: true, data: insertResult };
          break;

        case "update":
          if (!data || !data.id) {
            throw new Error("No ID provided for update operation");
          }
          
          const { id, ...updateFields } = data;
          const { data: updateResult, error: updateError } = await supabase
            .from(table)
            .update(updateFields)
            .eq('id', id)
            .eq('user_id', user?.id)
            .select();
          
          if (updateError) throw updateError;
          result = { success: true, data: updateResult };
          break;

        case "delete":
          if (!data || !data.id) {
            throw new Error("No ID provided for delete operation");
          }
          
          const { data: deleteResult, error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id)
            .eq('user_id', user?.id)
            .select();
          
          if (deleteError) throw deleteError;
          result = { success: true, data: deleteResult };
          break;
          
        default:
          throw new Error("Unknown operation");
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);
    
    // Prepare context
    const context = extractedData ? { extracted_data: extractedData } : {};
    
    try {
      // Get AI response
      const aiResponse = await chatWithAI(userInput, context);
      
      // Clean the AI response to remove markdown formatting
      const cleanedResponse = cleanMarkdownResponse(aiResponse);
      
      // Enhanced pattern matching for database operations
      const lowerInput = userInput.toLowerCase();
      const lowerResponse = cleanedResponse.toLowerCase();
      
      // Check for various operation patterns
      const operationPatterns = {
        store: /(store|save|add|insert|create|put)\s+(.+)/i,
        retrieve: /(retrieve|get|show|fetch|display|find)\s+(.+)/i,
        delete: /(delete|remove|drop|erase)\s+(.+)/i,
        update: /(update|modify|change|edit)\s+(.+)/i
      };

      let shouldPerformOperation = false;
      let operation = "select";
      let table: AvailableTables = "budget_items";
      let operationData: any = null;

      // Check for JSON-based operations
      const jsonOperationPatterns = {
        useJson: /(use|insert|create|add|store|save)\s+(json|data|records|items|the data|this data)/i,
        updateFromJson: /(update|modify|change)\s+(from|using)\s+(json|data)/i,
        deleteFromJson: /(delete|remove)\s+(from|using)\s+(json|data)/i
      };

      // Check if user wants to use JSON data
      if (jsonOperationPatterns.useJson.test(lowerInput) || 
          lowerInput.includes("insert the json") ||
          lowerInput.includes("create from json") ||
          lowerInput.includes("add the data") ||
          lowerInput.includes("store the json")) {
        
        shouldPerformOperation = true;
        operation = "insert";
        
        // Try to parse JSON data from the JSON Editor
        if (jsonData && jsonData.trim()) {
          try {
            const parsedJson = JSON.parse(jsonData);
            console.log('Parsed JSON data for operation:', parsedJson);
            
            // Determine table based on JSON structure or user input
            if (lowerInput.includes("invoice") || lowerInput.includes("bill")) {
              table = "invoices";
            } else if (lowerInput.includes("cash flow") || lowerInput.includes("transaction")) {
              table = "cash_flow_items";
            } else if (lowerInput.includes("investment") || lowerInput.includes("portfolio")) {
              table = "investments";
            } else if (lowerInput.includes("financial") || lowerInput.includes("data")) {
              table = "financial_data";
            } else {
              // Try to determine table from JSON structure
              if (parsedJson.category && (parsedJson.budgeted || parsedJson.actual)) {
                table = "budget_items";
              } else if (parsedJson.description && parsedJson.amount && parsedJson.type) {
                table = "cash_flow_items";
              } else if (parsedJson.invoice_number || parsedJson.client_name) {
                table = "invoices";
              } else if (parsedJson.symbol || parsedJson.name) {
                table = "investments";
              } else if (parsedJson.period || parsedJson.revenue) {
                table = "financial_data";
              }
            }
            
            // Handle array of records
            if (Array.isArray(parsedJson)) {
              operationData = parsedJson;
            } else {
              operationData = parsedJson;
            }
            
          } catch (jsonError) {
            const errorMessage: Message = {
              role: "assistant",
              content: `❌ Invalid JSON data in the JSON Editor. Please fix the JSON format before performing database operations.\n\nError: ${jsonError}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        } else {
          const errorMessage: Message = {
            role: "assistant",
            content: "❌ No JSON data available in the JSON Editor. Please upload a file or add data to the JSON Editor first.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      // Check for update operations using JSON
      else if (jsonOperationPatterns.updateFromJson.test(lowerInput) ||
               lowerInput.includes("update from json") ||
               lowerInput.includes("modify using data")) {
        
        shouldPerformOperation = true;
        operation = "update";
        
        if (jsonData && jsonData.trim()) {
          try {
            const parsedJson = JSON.parse(jsonData);
            operationData = parsedJson;
            
            // Determine table
            if (lowerInput.includes("invoice")) {
              table = "invoices";
            } else if (lowerInput.includes("cash flow")) {
              table = "cash_flow_items";
            } else if (lowerInput.includes("investment")) {
              table = "investments";
            } else if (lowerInput.includes("financial")) {
              table = "financial_data";
            } else {
              table = "budget_items";
            }
          } catch (jsonError) {
            const errorMessage: Message = {
              role: "assistant",
              content: `❌ Invalid JSON data for update operation: ${jsonError}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Check for delete operations using JSON
      else if (jsonOperationPatterns.deleteFromJson.test(lowerInput) ||
               lowerInput.includes("delete from json") ||
               lowerInput.includes("remove using data")) {
        
        shouldPerformOperation = true;
        operation = "delete";
        
        if (jsonData && jsonData.trim()) {
          try {
            const parsedJson = JSON.parse(jsonData);
            operationData = parsedJson;
            
            // Determine table
            if (lowerInput.includes("invoice")) {
              table = "invoices";
            } else if (lowerInput.includes("cash flow")) {
              table = "cash_flow_items";
            } else if (lowerInput.includes("investment")) {
              table = "investments";
            } else if (lowerInput.includes("financial")) {
              table = "financial_data";
            } else {
              table = "budget_items";
            }
          } catch (jsonError) {
            const errorMessage: Message = {
              role: "assistant",
              content: `❌ Invalid JSON data for delete operation: ${jsonError}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }
      }

      // Check for store/save operations
      else if (operationPatterns.store.test(lowerInput) || 
          lowerInput.includes("store this") || 
          lowerInput.includes("save this") ||
          lowerInput.includes("add this") ||
          lowerInput.includes("insert this") ||
          lowerInput.includes("create") ||
          lowerInput.includes("new invoice") ||
          lowerInput.includes("create invoice")) {
        
        shouldPerformOperation = true;
        operation = "insert";
        
        // Extract data from user input or uploaded file
        if (extractedData && extractedData.content) {
          // Use uploaded file data
          if (extractedData.file_type === 'csv' || extractedData.file_type === 'xlsx') {
            const fileData = extractedData.content;
            if (fileData.columns && fileData.data && fileData.data.length > 0) {
              // Convert first row to budget item format
              const firstRow = fileData.data[0];
              const headers = fileData.columns;
              
              // Try to map common column names
              const categoryIndex = headers.findIndex((h: string) => 
                h.toLowerCase().includes('category') || h.toLowerCase().includes('description') || h.toLowerCase().includes('name')
              );
              const amountIndex = headers.findIndex((h: string) => 
                h.toLowerCase().includes('amount') || h.toLowerCase().includes('budget') || h.toLowerCase().includes('value')
              );
              const typeIndex = headers.findIndex((h: string) => 
                h.toLowerCase().includes('type') || h.toLowerCase().includes('category')
              );

              if (categoryIndex !== -1 && amountIndex !== -1) {
                operationData = {
                  category: firstRow[categoryIndex] || "Imported Item",
                  budgeted: parseFloat(firstRow[amountIndex]) || 0,
                  actual: 0,
                  type: typeIndex !== -1 && firstRow[typeIndex]?.toLowerCase().includes('income') ? 'income' : 'expense'
                };
              }
            }
          }
        } else {
          // Extract from user input
          if (lowerInput.includes("groceries") || lowerInput.includes("food")) {
            const amount = extractAmount(lowerInput);
            operationData = { category: "Groceries", budgeted: amount, actual: 0, type: "expense" };
          } else if (lowerInput.includes("rent") || lowerInput.includes("housing")) {
            const amount = extractAmount(lowerInput);
            operationData = { category: "Rent", budgeted: amount, actual: 0, type: "expense" };
          } else if (lowerInput.includes("salary") || lowerInput.includes("income")) {
            const amount = extractAmount(lowerInput);
            operationData = { category: "Salary", budgeted: amount, actual: 0, type: "income" };
          } else if (lowerInput.includes("utilities") || lowerInput.includes("electricity")) {
            const amount = extractAmount(lowerInput);
            operationData = { category: "Utilities", budgeted: amount, actual: 0, type: "expense" };
          } else if (lowerInput.includes("transport") || lowerInput.includes("gas")) {
            const amount = extractAmount(lowerInput);
            operationData = { category: "Transportation", budgeted: amount, actual: 0, type: "expense" };
          }
        }

        // Determine table based on context
        if (lowerInput.includes("cash flow") || lowerInput.includes("transaction")) {
          table = "cash_flow_items";
          if (operationData) {
            operationData = {
              description: operationData.category,
              amount: operationData.budgeted,
              type: operationData.type,
              date: new Date().toISOString().split('T')[0]
            };
          }
        } else if (lowerInput.includes("invoice") || lowerInput.includes("bill") || lowerInput.includes("create") && lowerInput.includes("invoice")) {
          table = "invoices";
          
          // Extract invoice data from user input
          const invoiceData = extractInvoiceData(userInput);
          if (invoiceData) {
            // Validate required fields
            if (!invoiceData.client_name || !invoiceData.description || !invoiceData.amount) {
              const errorMessage: Message = {
                role: "assistant",
                content: "I need more information to create the invoice. Please provide:\n- Client name\n- Description of services\n- Amount\n\nExample: Create invoice for client ABC Corp, description: Web development services, amount: $2500",
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }
            
            console.log('Extracted invoice data:', invoiceData);
            operationData = invoiceData;
          } else {
            // Default invoice data if extraction fails
            operationData = {
              invoice_number: `INV-${Date.now()}`,
              client_name: "Unknown Client",
              description: "Invoice",
              amount: 0,
              status: "draft",
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              created_date: new Date().toISOString().split('T')[0]
            };
          }
        } else if (lowerInput.includes("investment") || lowerInput.includes("portfolio")) {
          table = "investments";
          if (operationData) {
            operationData = {
              name: operationData.category,
              amount: operationData.budgeted,
              type: "stock",
              date: new Date().toISOString().split('T')[0]
            };
          }
        }
      }

      // Check for retrieve operations
      else if (operationPatterns.retrieve.test(lowerInput) || 
               lowerInput.includes("show me") || 
               lowerInput.includes("get my") ||
               lowerInput.includes("display my")) {
        
        shouldPerformOperation = true;
        operation = "select";
        
        // Determine table based on context
        if (lowerInput.includes("cash flow") || lowerInput.includes("transactions")) {
          table = "cash_flow_items";
        } else if (lowerInput.includes("invoices") || lowerInput.includes("bills")) {
          table = "invoices";
        } else if (lowerInput.includes("investments") || lowerInput.includes("portfolio")) {
          table = "investments";
        } else if (lowerInput.includes("financial") || lowerInput.includes("data")) {
          table = "financial_data";
        } else {
          table = "budget_items"; // default
        }
      }

      // Check for delete operations
      else if (operationPatterns.delete.test(lowerInput) || 
               lowerInput.includes("delete this") || 
               lowerInput.includes("remove this")) {
        
        shouldPerformOperation = true;
        operation = "delete";
        
        // Try to extract ID from user input
        const idMatch = lowerInput.match(/(\d+)/);
        if (idMatch) {
          operationData = { id: idMatch[1] };
        } else {
          // If no ID provided, we'll need to get it from the user
          const errorMessage: Message = {
            role: "assistant",
            content: "I need the ID of the record you want to delete. Please provide the record ID or use the Database Operations panel to delete records.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Check for update operations
      else if (operationPatterns.update.test(lowerInput) || 
               lowerInput.includes("update this") || 
               lowerInput.includes("modify this")) {
        
        shouldPerformOperation = true;
        operation = "update";
        
        // Extract update data from user input
        const amount = extractAmount(lowerInput);
        if (amount > 0) {
          operationData = { budgeted: amount };
        }
        
        // Try to extract ID
        const idMatch = lowerInput.match(/(\d+)/);
        if (idMatch) {
          operationData = { ...operationData, id: idMatch[1] };
        } else {
          const errorMessage: Message = {
            role: "assistant",
            content: "I need the ID of the record you want to update. Please provide the record ID or use the Database Operations panel to update records.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Perform the operation if we have the necessary data
      if (shouldPerformOperation && (operation === "select" || operationData)) {
        try {
          const result = await handleAIDatabaseOperation(operation, table, operationData);
          
          if (result.success) {
            let successMessage = "";
            
            if (operation === "insert") {
              if (table === "invoices") {
                const invoiceData = result.data[0];
                successMessage = `✅ Invoice created successfully!\n\nInvoice Details:\n- Invoice Number: ${invoiceData.invoice_number}\n- Client: ${invoiceData.client_name}\n- Description: ${invoiceData.description}\n- Amount: $${invoiceData.amount}\n- Status: ${invoiceData.status}\n- Due Date: ${invoiceData.due_date}`;
              } else if (Array.isArray(operationData)) {
                const recordCount = result.data.length;
                successMessage = `✅ Successfully inserted ${recordCount} records from JSON data into your ${table.replace('_', ' ')}!`;
              } else {
                successMessage = `✅ Successfully stored the JSON data in your ${table.replace('_', ' ')}!`;
              }
            } else if (operation === "select") {
              const recordCount = Array.isArray(result.data) ? result.data.length : 1;
              successMessage = `📊 Retrieved ${recordCount} records from your ${table.replace('_', ' ')}. Check the JSON Editor to see the data.`;
              // Update JSON editor with the retrieved data
              setJsonData(JSON.stringify(result.data, null, 2));
            } else if (operation === "delete") {
              if (Array.isArray(operationData)) {
                const recordCount = operationData.length;
                successMessage = `🗑️ Successfully deleted ${recordCount} records from your ${table.replace('_', ' ')} using JSON data.`;
              } else {
                successMessage = `🗑️ Successfully deleted the record from your ${table.replace('_', ' ')}.`;
              }
            } else if (operation === "update") {
              if (Array.isArray(operationData)) {
                const recordCount = operationData.length;
                successMessage = `✏️ Successfully updated ${recordCount} records in your ${table.replace('_', ' ')} using JSON data.`;
              } else {
                successMessage = `✏️ Successfully updated the record in your ${table.replace('_', ' ')}.`;
              }
            }
            
            const assistantMessage: Message = {
              role: "assistant",
              content: successMessage,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        } catch (dbError) {
          console.error('Database operation error:', dbError);
          const errorMessage: Message = {
            role: "assistant",
            content: `❌ I couldn't complete the database operation: ${dbError instanceof Error ? dbError.message : String(dbError)}. Please use the Database Operations panel to manually perform this operation.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Regular AI response without database operation
        const assistantMessage: Message = {
          role: "assistant",
          content: cleanedResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract amounts from text
  const extractAmount = (text: string): number => {
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    return amountMatch ? parseFloat(amountMatch[1]) : 0;
  };

  // Helper function to extract invoice data from user input
  const extractInvoiceData = (text: string): any => {
    const lowerText = text.toLowerCase();
    
    // Extract invoice number
    const invMatch = text.match(/inv(\d+)/i) || text.match(/invoice\s*#?(\d+)/i);
    const invoiceNumber = invMatch ? `INV${invMatch[1]}` : `INV-${Date.now()}`;
    
    // Extract client name - improved pattern matching
    let client = "Unknown Client";
    const clientPatterns = [
      /client\s+([^,]+)/i,
      /for\s+client\s+([^,]+)/i,
      /client:\s*([^\n,]+)/i
    ];
    
    for (const pattern of clientPatterns) {
      const match = text.match(pattern);
      if (match) {
        client = match[1].trim();
        break;
      }
    }
    
    // Extract description - improved pattern matching
    let description = "Invoice";
    const descPatterns = [
      /description:\s*([^\n,]+)/i,
      /desc:\s*([^\n,]+)/i,
      /description\s+([^,]+)/i
    ];
    
    for (const pattern of descPatterns) {
      const match = text.match(pattern);
      if (match) {
        description = match[1].trim();
        break;
      }
    }
    
    // Extract due date
    const dueMatch = text.match(/due:\s*([^\n]+)/i) || text.match(/due date:\s*([^\n]+)/i) || text.match(/due in (\d+) days/i);
    let dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (dueMatch) {
      if (dueMatch[1].includes('days')) {
        // Handle "due in X days" format
        const daysMatch = dueMatch[1].match(/(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
      } else {
        try {
          const parsedDate = new Date(dueMatch[1].trim());
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // Keep default date if parsing fails
        }
      }
    }
    
    // Extract created date
    const createdMatch = text.match(/created:\s*([^\n]+)/i) || text.match(/created date:\s*([^\n]+)/i);
    let createdDate = new Date().toISOString().split('T')[0];
    if (createdMatch) {
      try {
        const parsedDate = new Date(createdMatch[1].trim());
        if (!isNaN(parsedDate.getTime())) {
          createdDate = parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        // Keep default date if parsing fails
      }
    }
    
    // Determine status
    let status = "draft";
    if (lowerText.includes("overdue")) {
      status = "overdue";
    } else if (lowerText.includes("paid")) {
      status = "paid";
    } else if (lowerText.includes("sent")) {
      status = "sent";
    } else if (lowerText.includes("pending")) {
      status = "draft";
    }
    
    // Extract amount if present
    const amount = extractAmount(text);
    
    console.log('Extracted invoice data:', {
      invoice_number: invoiceNumber,
      client_name: client,
      description: description,
      amount,
      status,
      due_date: dueDate,
      created_date: createdDate
    });
    
    return {
      invoice_number: invoiceNumber,
      client_name: client,
      description: description,
      amount,
      status,
      due_date: dueDate,
      created_date: createdDate
    };
  };

  // Helper function to clean markdown formatting from AI responses
  const cleanMarkdownResponse = (response: string): string => {
    return response
      // Remove bold formatting (**text** -> text)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic formatting (*text* -> text)
      .replace(/\*(.*?)\*/g, '$1')
      // Remove single asterisks at line start
      .replace(/^\s*\*\s+/gm, '- ')
      // Remove plus signs at line start
      .replace(/^\s*\+\s+/gm, '- ')
      // Remove numbered lists with asterisks
      .replace(/^\d+\.\s*\*\s+/gm, (match) => match.replace('*', ''))
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove any remaining markdown symbols
      .replace(/^\s*[#*+`~]\s*/gm, '')
      // Clean up tabs and extra spaces
      .replace(/\t/g, '  ')
      .trim();
  };

  const executeDatabaseOperation = async () => {
    if (!tableName) {
      toast.error("Please select a table");
      return;
    }

    try {
      let result;
      
      switch (databaseOperation) {
        case "select":
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', user?.id);
          
          if (error) throw error;
          result = { success: true, data };
          break;
          
        case "insert":
          if (!operationData) {
            toast.error("Please provide data for insert operation");
            return;
          }
          
          const insertData = JSON.parse(operationData);
          // Add user_id to the data
          const dataWithUserId = { ...insertData, user_id: user?.id };
          
          const { data: insertResult, error: insertError } = await supabase
            .from(tableName)
            .insert(dataWithUserId)
            .select();
          
          if (insertError) throw insertError;
          result = { success: true, data: insertResult };
          break;

        case "update":
          if (!operationData) {
            toast.error("Please provide data for update operation");
            return;
          }
          
          try {
            const updateData = JSON.parse(operationData);
            // Extract the record ID and update data
            const { id, ...updateFields } = updateData;
            
            if (!id) {
              toast.error("Please include 'id' field in the update data");
              return;
            }
            
            const { data: updateResult, error: updateError } = await supabase
              .from(tableName)
              .update(updateFields)
              .eq('id', id)
              .eq('user_id', user?.id) // Ensure user can only update their own data
              .select();
            
            if (updateError) throw updateError;
            result = { success: true, data: updateResult };
          } catch (parseError) {
            toast.error("Invalid JSON format for update data");
            return;
          }
          break;

        case "delete":
          if (!operationData) {
            toast.error("Please provide the record ID for delete operation");
            return;
          }
          
          try {
            const deleteData = JSON.parse(operationData);
            const recordId = deleteData.id;
            
            if (!recordId) {
              toast.error("Please include 'id' field in the delete data");
              return;
            }
            
            const { data: deleteResult, error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .eq('id', recordId)
              .eq('user_id', user?.id) // Ensure user can only delete their own data
              .select();
            
            if (deleteError) throw deleteError;
            result = { success: true, data: deleteResult, message: "Record deleted successfully" };
          } catch (parseError) {
            toast.error("Invalid JSON format for delete data");
            return;
          }
          break;
          
        default:
          toast.error("Operation not implemented yet");
          return;
      }

      if (result.success) {
        toast.success(result.message || "Database operation completed successfully!");
        
        // Sanitize data before displaying (remove sensitive fields)
        const sanitizedData = result.data ? result.data.map((item: any) => {
          const { user_id, id, ...sanitizedItem } = item;
          return sanitizedItem;
        }) : result.data;
        
        setJsonData(JSON.stringify(sanitizedData, null, 2));
        
        // Add operation result to chat (without sensitive data)
        const operationMessage: Message = {
          role: "assistant",
          content: `Database operation completed successfully!\n\nOperation: ${databaseOperation.toUpperCase()}\nTable: ${tableName}\nRecords affected: ${Array.isArray(result.data) ? result.data.length : 1}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, operationMessage]);
      }
    } catch (error) {
      toast.error(`Database operation failed: ${error}`);
      
      // Add error to chat
      const errorMessage: Message = {
        role: "assistant",
        content: `Database operation failed: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const downloadJson = () => {
    if (!jsonData) return;
    
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Upload files (PDF, Excel, CSV) to extract and analyze data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Choose File
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="mt-2"
              />
            </div>
            
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                  </div>
                </div>
                {isProcessing && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5" />
                AI Chat Interface
              </CardTitle>
              <CardDescription>
                Ask questions about your data, request analysis, or perform database operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages Display */}
                <div className="h-80 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                      <p className="text-sm">
                        Ask questions about your data, request analysis, or perform database operations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}>
                            <div className="text-sm font-medium mb-1">
                              {message.role === "user" ? "You" : "AI Assistant"}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                            <div className="text-sm font-medium mb-1">AI Assistant</div>
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                              </div>
                              <span className="text-sm">Processing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input and Buttons */}
                <div className="flex gap-3">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 resize-none"
                    rows={3}
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!userInput.trim() || isLoading}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearChat} 
                      disabled={isLoading}
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* JSON Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                JSON Editor
              </CardTitle>
              <CardDescription>
                View and edit extracted data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jsonData ? (
                  <>
                    <Textarea
                      value={jsonData}
                      onChange={(e) => setJsonData(e.target.value)}
                      className="h-48 text-xs font-mono"
                      placeholder="JSON data will appear here..."
                    />
                    <Button 
                      onClick={downloadJson} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No data available</p>
                    <p className="text-xs">Upload a file to see extracted data here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-5 w-5" />
                Database Operations
              </CardTitle>
              <CardDescription>
                Manage your data directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="operation" className="text-sm font-medium">Operation</Label>
                  <Select value={databaseOperation} onValueChange={setDatabaseOperation}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="insert">Insert</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="table-name" className="text-sm font-medium">Table Name</Label>
                  <Select value={tableName} onValueChange={(value: AvailableTables) => setTableName(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget_items">Budget Items</SelectItem>
                      <SelectItem value="cash_flow_items">Cash Flow Items</SelectItem>
                      <SelectItem value="invoices">Invoices</SelectItem>
                      <SelectItem value="investments">Investments</SelectItem>
                      <SelectItem value="financial_data">Financial Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {databaseOperation !== "select" && (
                  <div>
                    <Label htmlFor="operation-data" className="text-sm font-medium">Data (JSON format)</Label>
                    <Textarea
                      id="operation-data"
                      value={operationData}
                      onChange={(e) => setOperationData(e.target.value)}
                      placeholder='{"category": "Food", "budgeted": 500, "actual": 450, "type": "expense"}'
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}

                <Button 
                  onClick={executeDatabaseOperation} 
                  className="w-full"
                >
                  Execute Operation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgenticControl; 