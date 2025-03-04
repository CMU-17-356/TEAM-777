## Install Frontend Dependencies (Run inside the frontend directory.)
Run `npm install` or `yarn install` 

## Install Backend Dependencies (Run inside the backend directory.)
```sh
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```
- To connect to Mongodb, make sure to create an `.env` file in backend folder that includes
    mongodb+srv://<db_username>:<db_password>@cluster0.i8at4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

## Run the application locally 
- Open a terminal in backend directory
```sh
python app.py
```
- Open a terminal in the frontend directory
```sh
npm start
```
- You should be able to see a running app at [http://localhost:3000/](http://localhost:3000/)

## Frontend Code formatting and Eslint rules 
- After making any modifications in the frontend, run the following command in frontend folder:
```sh
npm run lint # Check for linting issues
npm run lint:fix # Fix auto-fixable linting issues
npm run format # Format with Prettier
```

## Backend Code formatting rules
- After making any modifications in the backend, run the following command in backend folder:
```sh
black . # Check and reformat for formmating issues
flake8 . # Check for linting issues
```

## Create your own github workspace to work with this project