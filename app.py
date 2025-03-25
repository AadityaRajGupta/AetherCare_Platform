from flask import Flask, request, render_template, redirect, url_for, jsonify
from src.helper import download_hugging_face_embeddings, custom_retrieval_qa
from src.symptom_helper import symptoms_dict, get_predicted_value, get_disease_details  # Import required variables and functions
from langchain.prompts import PromptTemplate
from langchain_community.llms import CTransformers
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from dotenv import load_dotenv
from src.prompt import *
import json
import os

app = Flask(__name__)

# Render the template for all pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

@app.route('/finder')
def finder():
    return render_template('finder.html')

@app.route('/symptom')
def symptom():
    return render_template('symptom.html', symptoms_dict=symptoms_dict)  # Add return and pass symptoms_dict

# Prediction Route
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    if request.method == 'POST':
        symptoms = request.form.get('symptoms')
        print(f"Received symptoms: {symptoms}")
        
        if not symptoms or symptoms.strip() == "Symptoms":
            message = "Please enter valid symptoms (e.g., itching, fever, cough)"
            return render_template('symptom.html', message=message, symptoms_dict=symptoms_dict)
        
        # Split the user's input into a list of symptoms (comma-separated)
        user_symptoms = [s.strip() for s in symptoms.split(',')]
        # Filter out invalid symptoms
        valid_symptoms = [symptom for symptom in user_symptoms if symptom in symptoms_dict]
        
        if not valid_symptoms:
            message = "No valid symptoms recognized. Please use symptoms like itching, fever, cough, etc."
            return render_template('symptom.html', message=message, symptoms_dict=symptoms_dict)
        
        predicted_disease = get_predicted_value(valid_symptoms)
        dis_des, my_precautions, medications, my_diet, workout = get_disease_details(predicted_disease)

        return render_template('symptom.html', 
                               predicted_disease=predicted_disease, 
                               dis_des=dis_des,
                               my_precautions=my_precautions, 
                               medications=medications, 
                               my_diet=my_diet,
                               workout=workout,
                               user_input=symptoms,
                               symptoms_dict=symptoms_dict)  # Pass symptoms_dict for POST success
    
    return render_template('symptom.html', symptoms_dict=symptoms_dict)  # Pass symptoms_dict for GET

# CHAT-BOT RELATED CODE HERE BELOW

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
INDEX_NAME = os.environ.get('INDEX_NAME')


embeddings = download_hugging_face_embeddings()

#Initializing the Pinecone
os.environ['PINECONE_API_KEY'] = PINECONE_API_KEY
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

#Loading the index
vectorstore=PineconeVectorStore.from_existing_index(INDEX_NAME, embeddings)


PROMPT=PromptTemplate(template=prompt_template, input_variables=["context", "question"])

llm_model = CTransformers(
    model="model/llama-2-7b-chat.ggmlv3.q4_0.bin",
    model_type="llama",
    config={
        'max_new_tokens': 200,  # Reduce to avoid over-generation
        'temperature': 0.4,     # Lower for less randomness
        'context_length': 2048,
        'top_p': 0.9,           # Add top-p sampling for coherence
        'top_k': 40             # Add top-k sampling for focus
    }
)
# Path to the cache file
CACHE_FILE = "chat_cache.json"

# Load cache from file if it exists
def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

# Save cache to file
def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

# Initialize cache
chat_cache = load_cache()

@app.route("/get_chat_bot_response", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    input = msg.strip().lower()  # Normalize input for cache key
    print(f"Received input: {input}")

    # Check if the response is already in cache
    if input in chat_cache:
        print(f"Cache hit for: {input}")
        return str(chat_cache[input])

    # If not in cache, get response from LLM
    result = custom_retrieval_qa(input, vectorstore, llm_model, PROMPT)
    # result = "hello"
    print(f"Response from LLM: {result}")

    # Store the result in cache
    chat_cache[input] = result
    save_cache(chat_cache)  # Save to file
    return str(result)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port= 5555,debug= True)