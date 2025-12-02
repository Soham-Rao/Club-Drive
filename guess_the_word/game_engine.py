import gensim.downloader as api
import random
import numpy as np
import os
import difflib

class GameEngine:
    def __init__(self):
        self.model = None
        self.secret_word = ""
        self.guesses = []
        self.timer = 60
        self.difficulty = "medium"
        self.word_list = []
        self.model_name = "glove-wiki-gigaword-50"
        #self.model_name = "word2vec-google-news-300"
        self.revealed_indices = set()
        
        # Curated lists for college students
        self.easy_words = [
            "apple", "book", "car", "dog", "eat", "fish", "game", "happy", "ice", "jump",
            "king", "love", "money", "night", "open", "phone", "queen", "rain", "school", "time",
            "water", "year", "zoo", "ball", "cat", "door", "egg", "food", "girl", "home"
        ]
        self.medium_words = [
            "action", "beauty", "change", "design", "energy", "future", "growth", "health", "impact", "journey",
            "knowledge", "leader", "memory", "nature", "option", "peace", "quality", "result", "simple", "target",
            "unique", "value", "wonder", "youth", "zone", "artist", "bridge", "circle", "dream", "event"
        ]
        self.hard_words = [
            "absolute", "brilliant", "concept", "dynamic", "element", "function", "gravity", "harmony", "illusion", "justice",
            "kinetic", "logical", "mystery", "network", "opinion", "parallel", "quantum", "radical", "structure", "theory",
            "universe", "virtual", "wisdom", "yield", "zenith", "abstract", "balance", "complex", "diverse", "essence"
        ]
        self.programming_words = [
            "python", "java", "code", "loop", "bug", "data", "list", "file", "web", "app",
            "server", "client", "user", "api", "html", "css", "logic", "error", "class", "object"
        ]
        
        self.ensure_model_loaded()

    def ensure_model_loaded(self):
        if self.model is None:
            print(f"Loading model {self.model_name}...")
            try:
                self.model = api.load(self.model_name)
                print("Model loaded successfully.")
            except Exception as e:
                print(f"Error loading model: {e}")

    def start_game(self, settings):
        self.difficulty = settings.get('difficulty', 'medium')
        self.timer = int(settings.get('timer', 60))
        
        if self.difficulty == 'custom':
            if os.path.exists('custom_words.txt'):
                with open('custom_words.txt', 'r') as f:
                    custom_words = [line.strip() for line in f if line.strip()]
                if custom_words:
                    self.secret_word = random.choice(custom_words)
                else:
                    self.secret_word = random.choice(self.medium_words) # Fallback
            else:
                self.secret_word = random.choice(self.medium_words) # Fallback
        elif self.difficulty == 'easy':
            self.secret_word = random.choice(self.easy_words)
        elif self.difficulty == 'hard':
            self.secret_word = random.choice(self.hard_words)
        elif self.difficulty == 'programming':
            self.secret_word = random.choice(self.programming_words)
        else: # medium
            self.secret_word = random.choice(self.medium_words)
            
        # Ensure secret word is in model (just in case curated list has issues, though they should be fine)
        # Ensure secret word is in model (just in case curated list has issues, though they should be fine)
        if self.model and self.secret_word not in self.model:
             # Fallback to a known word if for some reason it's missing (unlikely with glove-50 for these words)
             self.secret_word = "apple"
        elif not self.model:
            print("CRITICAL WARNING: Model not loaded. Game will be unstable.")

        self.guesses = []
        self.revealed_indices = set()
        
        print(f"SECRET WORD: {self.secret_word}")
        
        return {
            'word_length': len(self.secret_word),
            'timer': self.timer,
            'message': 'Game started!'
        }

    def process_guess(self, guess):
        guess = guess.lower().strip()
        if not guess:
            return {'status': 'unknown', 'message': 'Empty guess'}
        
        if guess == self.secret_word:
            return {'status': 'win', 'temperature': 'Melting', 'score': 1.0, 'secret_word': self.secret_word}
        
        if guess not in self.model:
            return {'status': 'unknown', 'message': 'Word not in vocabulary'}
            
        # Calculate similarity and convert to standard float for JSON serialization
        similarity = float(self.model.similarity(guess, self.secret_word))
        temperature, temp_class = self.get_temperature(similarity, guess)
        
        self.guesses.append({'word': guess, 'similarity': similarity, 'temperature': temperature})
        
        return {
            'status': 'continue',
            'similarity': similarity,
            'temperature': temperature
        }

    def get_temperature(self, similarity, guess_word):
        # Check for spelling similarity (Levenshtein-like)
        spelling_sim = difflib.SequenceMatcher(None, self.secret_word.lower(), guess_word.lower()).ratio()
        
        # If spelling is very close, override semantic similarity
        if spelling_sim >= 0.9: # e.g. "absolute" vs "absolutely"
            return "Melting", "melting"
        if spelling_sim >= 0.8:
            return "Burning", "burning"
            
        # Semantic similarity thresholds
        if similarity >= 0.8:
            return "Melting", "melting"
        elif similarity >= 0.6:
            return "Burning", "burning"
        elif similarity >= 0.45: # Lowered slightly
            return "Hot", "hot"
        elif similarity >= 0.3: # Lowered slightly
            return "Warm", "warm"
        elif similarity >= 0.2:
            return "Cool", "cool"
        elif similarity >= 0.1:
            return "Cold", "cold"
        else:
            return "Frozen", "frozen"

    def get_clue(self, clue_type='letter'):
        if clue_type == 'sentence':
            # Generate a sentence clue (related words)
            try:
                similar = self.model.most_similar(self.secret_word, topn=20)
                # Filter out words that share roots or are too similar in spelling
                filtered_words = []
                for w, s in similar:
                    w_lower = w.lower()
                    s_lower = self.secret_word.lower()
                    # Check for substring match (e.g. land in landing)
                    if w_lower in s_lower or s_lower in w_lower:
                        continue
                    # Check for shared prefix (simple stemming)
                    if w_lower[:4] == s_lower[:4] and len(w_lower) > 4:
                        continue
                    
                    if w not in [g['word'] for g in self.guesses]:
                        filtered_words.append(w)
                
                selected_words = filtered_words[:3]
                if selected_words:
                    return {'type': 'sentence', 'text': f"This word is often associated with concepts like: {', '.join(selected_words)}."}
                return {'type': 'sentence', 'text': "It's a unique word, keep guessing!"}
            except:
                return {'type': 'sentence', 'text': "Clue generation failed."}
        
        else: # letter clue
            word_len = len(self.secret_word)
            # Only reveal if less than half revealed
            if len(self.revealed_indices) < (word_len / 2):
                # Find unrevealed indices
                available = [i for i in range(word_len) if i not in self.revealed_indices]
                if available:
                    idx = random.choice(available)
                    self.revealed_indices.add(idx)
                    return {'type': 'letter', 'index': idx, 'letter': self.secret_word[idx]}
            
            return {'type': 'none', 'text': ''}

    def give_up(self):
        return {'secret_word': self.secret_word}
