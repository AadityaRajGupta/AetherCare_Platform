from src.helper import load_pdf,text_split,download_hugging_face_embeddings
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

load_dotenv()
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
INDEX_NAME = os.environ.get('INDEX_NAME')

os.environ['PINECONE_API_KEY'] = PINECONE_API_KEY

extracted_data = load_pdf("data/")
text_chunks = text_split(extracted_data)
embeddings = download_hugging_face_embeddings()


pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# ONE TIME RUN ONLY Using openAI vectorStore.

# embeddings = OpenAIEmbeddings() we are not using openai embedding
vectorstore = PineconeVectorStore.from_texts(
    [t.page_content for t in text_chunks],
    index_name="health-bot",
    embedding=embeddings,
)
