#PART OF NEW RESTRUCTURING FILES.
from bloom import create_app
from dotenv import load_dotenv
load_dotenv()
from bloom.config import Config
import os

app = create_app(Config)
if __name__ == '__main__':
    app.run(debug=True)