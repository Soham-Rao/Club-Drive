import random

class GameEngine:
    def __init__(self):
        self.colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple']
        self.secret_code = []
        self.guesses = []
        self.max_turns = 10
        self.game_over = False
        self.win = False

    def start_game(self, mode='computer', secret_code=None):
        self.mode = mode
        if mode == 'multiplayer' and secret_code:
            self.secret_code = secret_code
        else:
            self.secret_code = [random.choice(self.colors) for _ in range(4)]
            
        self.guesses = []
        self.game_over = False
        self.win = False
        print(f"SECRET CODE: {self.secret_code}") # For debugging
        return {
            'message': 'Game started!',
            'colors': self.colors,
            'max_turns': self.max_turns,
            'turns_left': self.max_turns
        }

    def restart_game(self):
        # If multiplayer, keep the same code? Or maybe reset to computer?
        # For now, let's just restart with a new random code if computer, 
        # or keep same code if multiplayer (or maybe ask user? simpler to just restart logic)
        # Actually, for multiplayer, usually you'd want to set a NEW code.
        # So restart should probably just go back to home or re-randomize for computer.
        # Let's assume restart is "Play Again" with same mode.
        if self.mode == 'multiplayer':
             # In multiplayer, "Play Again" usually means new round, so new code needed.
             # But we can't get new code from user here easily without UI.
             # So let's just randomize it for now or keep it. 
             # Better UX: Redirect to home. But for API, let's just randomize to avoid errors.
             self.secret_code = [random.choice(self.colors) for _ in range(4)]
        else:
             self.secret_code = [random.choice(self.colors) for _ in range(4)]
             
        self.guesses = []
        self.game_over = False
        self.win = False
        return {
            'message': 'Game started!',
            'colors': self.colors,
            'max_turns': self.max_turns,
            'turns_left': self.max_turns
        }

    def check_guess(self, guess):
        if self.game_over:
            return {'status': 'game_over', 'message': 'Game is already over.'}

        if len(guess) != 4:
            return {'status': 'error', 'message': 'Guess must be 4 colors.'}

        # Calculate Feedback
        black_pegs = 0
        white_pegs = 0
        
        # Create copies to avoid modifying original lists during calculation
        secret_copy = self.secret_code[:]
        guess_copy = guess[:]
        
        # 1. Calculate Black Pegs (Correct Color & Position)
        for i in range(4):
            if guess[i] == self.secret_code[i]:
                black_pegs += 1
                secret_copy[i] = None # Mark as used
                guess_copy[i] = None  # Mark as used

        # 2. Calculate White Pegs (Correct Color, Wrong Position)
        for i in range(4):
            if guess_copy[i] is not None: # If not already matched as black
                if guess_copy[i] in secret_copy:
                    white_pegs += 1
                    # Remove ONE instance of this color from secret_copy
                    secret_copy[secret_copy.index(guess_copy[i])] = None

        feedback = {'black': black_pegs, 'white': white_pegs}
        
        self.guesses.append({
            'guess': guess,
            'feedback': feedback
        })

        # Check Win/Loss
        if black_pegs == 4:
            self.game_over = True
            self.win = True
            return {
                'status': 'win',
                'feedback': feedback,
                'secret_code': self.secret_code,
                'turns_left': self.max_turns - len(self.guesses)
            }
        
        if len(self.guesses) >= self.max_turns:
            self.game_over = True
            self.win = False
            return {
                'status': 'lose',
                'feedback': feedback,
                'secret_code': self.secret_code,
                'turns_left': 0
            }

        return {
            'status': 'continue',
            'feedback': feedback,
            'turns_left': self.max_turns - len(self.guesses)
        }
