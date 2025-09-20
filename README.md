# Career Guidance System

An intelligent web application that helps engineering students in Computer Science, IT, and Electronics discover their ideal career paths through AI-powered assessments.

## Features

### 🎯 Self-Assessment Module

- Interactive form with 17 core subjects
- 7-point rating scale (Not Interested → Professional)
- Subjects include Database Fundamentals, AI/ML, Cybersecurity, Web Development, and more

### 🤖 AI-Powered Career Prediction

- Machine learning model trained on career data
- Predicts top 3 most suitable career roles
- Displays confidence scores with visual progress bars
- Shows model accuracy for transparency

### 📚 Career Information Hub

- Detailed career descriptions and requirements
- Technology stacks and required skills
- Salary ranges and growth paths
- Top hiring companies for each role

### 🎓 Learning Resources

- Curated links to trusted educational platforms
- Categorized by subject areas
- Links to Javatpoint, W3Schools, Coursera, and more
- Opens in new tabs for seamless learning

### 💾 Data Storage

- SQLite database for storing assessments
- User assessment history
- Career prediction results

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Python Flask
- **Machine Learning**: Scikit-learn, Joblib
- **Database**: SQLite
- **Styling**: Custom CSS with animations and responsive design

## Installation

1. **Clone or navigate to the project directory**

   ```bash
   cd /home/avityagi/Desktop/CareerGuidance
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**

   ```bash
   python app.py
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
CareerGuidance/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── todo.md               # Project requirements
├── career_assessments.db # SQLite database (created automatically)
├── clientProvided/       # ML model and training files
│   ├── career_model.pkl
│   ├── role_encoder.pkl
│   ├── feature_columns.pkl
│   └── ...
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Custom styling
    └── js/
        └── app.js        # Frontend JavaScript
```

## Usage

1. **Take the Assessment**

   - Navigate to the assessment section
   - Rate your expertise in 17 key subjects
   - Click "Discover Yourself!" to get predictions

2. **View Results**

   - See your top 3 career matches
   - View confidence scores and model accuracy
   - Click "Learn More" for detailed career information

3. **Explore Careers**

   - Read detailed role descriptions
   - View required skills and technologies
   - See salary ranges and career growth paths
   - Discover top hiring companies

4. **Access Learning Resources**
   - Browse categorized learning materials
   - Access links to educational platforms
   - Continue learning in areas of interest

## Supported Career Roles

- Data Scientist
- Software Developer
- Cloud Engineer
- Cybersecurity Analyst
- Web Developer
- AI/ML Engineer

## Model Information

The application uses a pre-trained machine learning model that:

- Processes 17 skill ratings and personality traits
- Uses Decision Tree Classification
- Achieves ~87% accuracy on test data
- Provides probability scores for career matching

## API Endpoints

- `GET /` - Main application interface
- `POST /predict` - Career prediction endpoint
- `GET /career/<career_name>` - Career details
- `GET /learning-resources` - Learning resources

## Features Implemented

✅ Self-assessment form with 7-point rating scale  
✅ AI-powered career prediction (top 3 matches)  
✅ Visual progress bars for match scores  
✅ Model accuracy display  
✅ Career blog panels with detailed information  
✅ Learning resources with external links  
✅ Responsive design with modern UI  
✅ SQLite database integration  
✅ Error handling and loading states

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please ensure you have proper licensing for any external resources used.

## Support

For issues or questions, please check the project documentation or create an issue in the repository.
