import gensim.downloader as api
import os

def create_custom_set():
    print("Loading model to validate words...")
    try:
        model = api.load("glove-wiki-gigaword-50")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    print("\nEnter words separated by commas (e.g., apple, banana, computer).")
    print("These words will be used for the 'Custom' difficulty.")
    user_input = input("Words: ")
    
    words = [w.strip().lower() for w in user_input.split(',') if w.strip()]
    valid_words = []
    invalid_words = []

    for w in words:
        if w in model:
            valid_words.append(w)
        else:
            invalid_words.append(w)

    if invalid_words:
        print(f"\nThe following words were not found in the model and will be ignored: {', '.join(invalid_words)}")

    if valid_words:
        with open("custom_words.txt", "w") as f:
            f.write("\n".join(valid_words))
        print(f"\nSuccessfully saved {len(valid_words)} words to 'custom_words.txt'.")
        print("You can now select 'Custom' difficulty in the game.")
    else:
        print("\nNo valid words were entered.")

if __name__ == "__main__":
    create_custom_set()
