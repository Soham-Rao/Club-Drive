import gensim.downloader as api
import os

def setup():
    print("Downloading/Loading Word2Vec model (glove-wiki-gigaword-50)...")
    try:
        model = api.load("glove-wiki-gigaword-50")
        print("Model downloaded and saved to cache.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup()
