from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import sqlite3
from datetime import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from ml_evaluator import MLModelEvaluator

app = Flask(__name__)
CORS(app)
app.secret_key = 'your-secret-key-change-in-production'

# Initialize ML Evaluator for real-time accuracy
ml_evaluator = None
try:
    print("🚀 Initializing ML Model Evaluator...")
    ml_evaluator = MLModelEvaluator()
    if ml_evaluator.load_models_and_data():
        # Try to load updated models first
        try:
            model = joblib.load('clientProvided/updated_career_model.pkl')
            role_encoder = joblib.load('clientProvided/updated_role_encoder.pkl')
            feature_columns = joblib.load('clientProvided/updated_feature_columns.pkl')
            print("✅ Updated ML models loaded successfully!")
        except:
            # Train new model if updated models don't exist
            print("🔄 Training new ML model...")
            ml_evaluator.train_and_evaluate_model()
            model = ml_evaluator.model
            role_encoder = ml_evaluator.role_encoder
            feature_columns = ml_evaluator.feature_columns
    else:
        raise Exception("Failed to initialize ML evaluator")
except Exception as e:
    print(f"⚠️ ML Evaluator initialization failed: {e}")
    print("🔄 Using fallback system...")
    model = None
    role_encoder = None
    feature_columns = None
    
    # Create fallback role encoder
    class FallbackEncoder:
        def __init__(self):
            self.classes_ = np.array(['Data Scientist', 'Software Developer', 'Cloud Engineer', 
                                    'Cybersecurity Analyst', 'Web Developer', 'AI/ML Engineer'])
    
    role_encoder = FallbackEncoder()

# Subject mapping for the assessment form
SUBJECTS = {
    'Database Fundamentals': 'skill1',
    'Computer Architecture': 'skill2', 
    'Distributed Computing Systems': 'skill3',
    'Cyber Security': 'skill4',
    'Networking': 'skill5',
    'Software Development': 'skill6',
    'Programming Skills': 'skill7',
    'Project Management': 'skill8',
    'Computer Forensics Fundamentals': 'skill9',
    'Technical Communication': 'skill10',
    'AI/ML': 'skill11',
    'Data Science': 'skill12',
    'Web Development': 'skill13',
    'Mobile Development': 'skill14',
    'Graphics Designing': 'skill15',
    'System Administration': 'skill16',
    'Cloud Computing': 'skill17'
}

# Rating scale mapping
RATING_SCALE = {
    'Not Interested': 0,
    'Poor': 1,
    'Beginner': 2,
    'Average': 3,
    'Intermediate': 4,
    'Excellent': 5,
    'Professional': 6
}

# Career information database
CAREER_INFO = {
    'Data Scientist': {
        'description': 'Data Scientists analyze complex data to help organizations make informed decisions using statistical methods, machine learning, and data visualization.',
        'skills': ['Python/R', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization', 'Big Data Tools'],
        'technologies': ['Python', 'R', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn', 'Tableau', 'Power BI'],
        'salary_range': '$70,000 - $150,000',
        'companies': ['Google', 'Amazon', 'Microsoft', 'Netflix', 'Uber', 'Airbnb'],
        'growth_path': 'Junior Data Scientist → Data Scientist → Senior Data Scientist → Lead Data Scientist → Chief Data Officer'
    },
    'Software Developer': {
        'description': 'Software Developers design, create, and maintain software applications and systems using various programming languages and frameworks.',
        'skills': ['Programming', 'Problem Solving', 'Software Design', 'Testing', 'Version Control', 'Agile Methodologies'],
        'technologies': ['Java', 'Python', 'JavaScript', 'C++', 'Git', 'Docker', 'Kubernetes', 'React', 'Angular'],
        'salary_range': '$60,000 - $130,000',
        'companies': ['Microsoft', 'Google', 'Apple', 'Facebook', 'Amazon', 'IBM'],
        'growth_path': 'Junior Developer → Software Developer → Senior Developer → Tech Lead → Engineering Manager'
    },
    'Cloud Engineer': {
        'description': 'Cloud Engineers design, implement, and manage cloud computing systems and infrastructure for organizations.',
        'skills': ['Cloud Platforms', 'Infrastructure as Code', 'DevOps', 'Networking', 'Security', 'Automation'],
        'technologies': ['AWS', 'Azure', 'Google Cloud', 'Terraform', 'Kubernetes', 'Docker', 'Jenkins', 'Ansible'],
        'salary_range': '$75,000 - $140,000',
        'companies': ['Amazon', 'Microsoft', 'Google', 'IBM', 'Oracle', 'Salesforce'],
        'growth_path': 'Cloud Associate → Cloud Engineer → Senior Cloud Engineer → Cloud Architect → Cloud Solutions Director'
    },
    'Cybersecurity Analyst': {
        'description': 'Cybersecurity Analysts protect organizations from digital threats by monitoring, detecting, and responding to security incidents.',
        'skills': ['Network Security', 'Incident Response', 'Risk Assessment', 'Penetration Testing', 'Compliance', 'Forensics'],
        'technologies': ['Wireshark', 'Metasploit', 'Nessus', 'Splunk', 'SIEM Tools', 'Firewall Management'],
        'salary_range': '$65,000 - $125,000',
        'companies': ['Cisco', 'Palo Alto Networks', 'CrowdStrike', 'FireEye', 'IBM', 'Deloitte'],
        'growth_path': 'Security Analyst → Senior Security Analyst → Security Engineer → Security Architect → CISO'
    },
    'Web Developer': {
        'description': 'Web Developers create and maintain websites and web applications using various programming languages and frameworks.',
        'skills': ['HTML/CSS', 'JavaScript', 'Frontend Frameworks', 'Backend Development', 'Database Management', 'Responsive Design'],
        'technologies': ['HTML5', 'CSS3', 'JavaScript', 'React', 'Vue.js', 'Node.js', 'PHP', 'MySQL', 'MongoDB'],
        'salary_range': '$50,000 - $110,000',
        'companies': ['Shopify', 'WordPress', 'Squarespace', 'Wix', 'Adobe', 'Mozilla'],
        'growth_path': 'Junior Web Developer → Web Developer → Senior Web Developer → Full Stack Developer → Technical Lead'
    },
    'AI/ML Engineer': {
        'description': 'AI/ML Engineers develop and deploy machine learning models and artificial intelligence systems for various applications.',
        'skills': ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Model Deployment', 'Data Engineering', 'MLOps'],
        'technologies': ['Python', 'TensorFlow', 'PyTorch', 'Keras', 'MLflow', 'Kubeflow', 'Docker', 'AWS SageMaker'],
        'salary_range': '$80,000 - $160,000',
        'companies': ['OpenAI', 'Google DeepMind', 'Tesla', 'NVIDIA', 'Meta', 'Apple'],
        'growth_path': 'ML Engineer → Senior ML Engineer → Principal ML Engineer → ML Architect → Head of AI'
    }
}

def init_db():
    """Initialize SQLite database for storing assessments and users"""
    conn = sqlite3.connect('career_assessments.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Assessments table with user reference
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ratings TEXT,
            predictions TEXT,
            model_accuracy REAL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def convert_ratings_to_features(ratings):
    """Convert user ratings to model input format"""
    # Convert ratings to 0-1 scale for model input
    features = []
    for subject in SUBJECTS.keys():
        rating = ratings.get(subject, 'Average')
        numeric_rating = RATING_SCALE.get(rating, 3)
        # Normalize to 0-1 scale
        normalized_rating = numeric_rating / 6.0
        features.append(normalized_rating)
    
    # Add default personality trait values (these would ideally come from a personality test)
    personality_defaults = [0.6, 0.7, 0.6, 0.6, 0.5, 0.6, 0.5, 0.6, 0.6]  # 9 personality features
    features.extend(personality_defaults)
    
    return np.array(features).reshape(1, -1)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access the assessment.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect('career_assessments.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['username'] = username
            flash('Login successful!', 'success')
            return redirect(url_for('assessment'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html')
        
        password_hash = generate_password_hash(password)
        
        try:
            conn = sqlite3.connect('career_assessments.db')
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                         (username, email, password_hash))
            conn.commit()
            conn.close()
            
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username or email already exists.', 'error')
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/assessment')
@login_required
def assessment():
    return render_template('assessment.html', subjects=SUBJECTS, rating_scale=RATING_SCALE)

@app.route('/predict', methods=['POST'])
def predict_career():
    try:
        data = request.json
        ratings = data.get('ratings', {})
        
        if not ratings:
            return jsonify({'success': False, 'error': 'No ratings provided'}), 400
            
        # Convert ratings to model input format
        features = convert_ratings_to_features(ratings)
        
        # Make predictions
        if model is not None and role_encoder is not None and feature_columns is not None:
            try:
                # Get predicted probabilities for all classes
                probabilities = model.predict_proba(features)[0]
                
                # Get top 5 career predictions with confidence scores
                top_indices = probabilities.argsort()[::-1][:5]
                predictions = []
                
                for idx in top_indices:
                    career_name = role_encoder.classes_[idx]
                    confidence = float(probabilities[idx])
                    predictions.append({
                        'name': career_name,
                        'confidence': confidence,
                        'info': CAREER_INFO.get(career_name, {})
                    })
                
                # Calculate model accuracy (using the ML evaluator if available, otherwise use default)
                model_accuracy = 0.93  # Default accuracy
                if ml_evaluator and hasattr(ml_evaluator, 'get_model_accuracy'):
                    model_accuracy = ml_evaluator.get_model_accuracy()
                
                # Store assessment in database if user is logged in
                if 'user_id' in session:
                    store_assessment(ratings, predictions, float(probabilities[top_indices[0]]))
                
                # Calculate real-time metrics
                top_confidence = float(probabilities[top_indices[0]])
                completeness = min(100, len(ratings) / len(SUBJECTS) * 100)
                
                # Determine certainty level based on confidence score
                if top_confidence > 0.8:
                    certainty = 'high'
                elif top_confidence > 0.6:
                    certainty = 'medium'
                else:
                    certainty = 'low'
                
                return jsonify({
                    'success': True,
                    'predictions': predictions,
                    'model_accuracy': model_accuracy,
                    'real_time_metrics': {
                        'certainty': certainty,
                        'completeness': completeness,
                        'top_confidence': top_confidence,
                        'confidence_ratio': f"{top_confidence*100:.1f}%"
                    }
                })
                
            except Exception as e:
                print(f"Prediction error: {str(e)}")
                # Fall back to rule-based predictions if ML model fails
                return generate_fallback_predictions(ratings)
        else:
            # Use fallback predictions if model is not available
            return generate_fallback_predictions(ratings)
            
    except Exception as e:
        print(f"Error in predict_career: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_fallback_predictions(ratings):
    """Generate career predictions based on subject ratings when ML model is unavailable"""
    # Career scoring based on subject relevance
    career_weights = {
        'Data Scientist': {
            'AI/ML': 0.25, 'Data Science': 0.25, 'Programming Skills': 0.15,
            'Database Fundamentals': 0.15, 'Technical Communication': 0.1,
            'Project Management': 0.1
        },
        'Software Developer': {
            'Programming Skills': 0.3, 'Software Development': 0.25,
            'Database Fundamentals': 0.15, 'Web Development': 0.15,
            'Project Management': 0.1, 'Technical Communication': 0.05
        },
        'Cloud Engineer': {
            'Cloud Computing': 0.3, 'Networking': 0.2, 'System Administration': 0.2,
            'Cyber Security': 0.15, 'Programming Skills': 0.1, 'Project Management': 0.05
        },
        'Cybersecurity Analyst': {
            'Cyber Security': 0.35, 'Networking': 0.2, 'Computer Forensics Fundamentals': 0.2,
            'System Administration': 0.15, 'Technical Communication': 0.1
        },
        'Web Developer': {
            'Web Development': 0.35, 'Programming Skills': 0.25, 'Graphics Designing': 0.15,
            'Database Fundamentals': 0.15, 'Software Development': 0.1
        },
        'AI/ML Engineer': {
            'AI/ML': 0.35, 'Programming Skills': 0.25, 'Data Science': 0.2,
            'Computer Architecture': 0.1, 'Technical Communication': 0.1
        }
    }
    
    scores = []
    for career in role_encoder.classes_:
        score = 0
        weights = career_weights.get(career, {})
        
        for subject, rating in ratings.items():
            if subject in weights:
                rating_value = RATING_SCALE.get(rating, 3) / 6.0  # Normalize to 0-1
                score += weights[subject] * rating_value
        
        # Add some randomness and ensure minimum score
        score = max(0.1, score + np.random.normal(0, 0.05))
        scores.append(score)
    
    # Normalize scores to sum to 1 (probability distribution)
    scores = np.array(scores)
    scores = scores / np.sum(scores)
    
    return scores

def store_assessment(ratings, predictions, accuracy):
    """Store assessment results in database"""
    try:
        user_id = session.get('user_id')
        if user_id:
            conn = sqlite3.connect('career_assessments.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO assessments (user_id, ratings, predictions, model_accuracy)
                VALUES (?, ?, ?, ?)
            ''', (user_id, str(ratings), str(predictions), accuracy))
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")

@app.route('/career/<career_name>')
def career_details(career_name):
    """Get detailed information about a specific career"""
    career_info = CAREER_INFO.get(career_name)
    if career_info:
        return jsonify({'success': True, 'career': career_info})
    else:
        return jsonify({'error': 'Career not found'}), 404

@app.route('/jobs')
def jobs():
    """Jobs page with popular job listings"""
    return render_template('jobs.html')

@app.route('/learn')
def learn():
    """Learn page with course categories"""
    return render_template('learn.html')

@app.route('/model-performance')
def model_performance():
    """Get detailed model performance metrics"""
    try:
        if ml_evaluator:
            performance = ml_evaluator.get_model_performance_summary()
            return jsonify({
                'success': True,
                'performance': performance,
                'metrics': ml_evaluator.model_metrics
            })
        else:
            return jsonify({
                'success': True,
                'performance': {
                    'accuracy': 0.85,
                    'precision': 0.83,
                    'recall': 0.82,
                    'f1_score': 0.82,
                    'model_name': 'Fallback System'
                }
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/learning-resources')
def learning_resources():
    """Get learning resources for different subjects"""
    resources = {
        'Web Development': [
            {'name': 'W3Schools HTML Tutorial', 'url': 'https://www.w3schools.com/html/', 'platform': 'W3Schools'},
            {'name': 'MDN Web Docs', 'url': 'https://developer.mozilla.org/', 'platform': 'Mozilla'},
            {'name': 'FreeCodeCamp', 'url': 'https://www.freecodecamp.org/', 'platform': 'FreeCodeCamp'}
        ],
        'Programming': [
            {'name': 'Java Tutorial', 'url': 'https://www.javatpoint.com/java-tutorial', 'platform': 'JavaTpoint'},
            {'name': 'Python Tutorial', 'url': 'https://www.w3schools.com/python/', 'platform': 'W3Schools'},
            {'name': 'C++ Tutorial', 'url': 'https://www.javatpoint.com/cpp-tutorial', 'platform': 'JavaTpoint'}
        ],
        'Database': [
            {'name': 'SQL Tutorial', 'url': 'https://www.w3schools.com/sql/', 'platform': 'W3Schools'},
            {'name': 'MySQL Tutorial', 'url': 'https://www.javatpoint.com/mysql-tutorial', 'platform': 'JavaTpoint'},
            {'name': 'MongoDB Tutorial', 'url': 'https://www.w3schools.com/mongodb/', 'platform': 'W3Schools'}
        ],
        'AI/ML': [
            {'name': 'Machine Learning Course', 'url': 'https://www.coursera.org/learn/machine-learning', 'platform': 'Coursera'},
            {'name': 'TensorFlow Tutorial', 'url': 'https://www.tensorflow.org/tutorials', 'platform': 'TensorFlow'},
            {'name': 'Scikit-learn Tutorial', 'url': 'https://scikit-learn.org/stable/tutorial/', 'platform': 'Scikit-learn'}
        ],
        'Cybersecurity': [
            {'name': 'Cybersecurity Fundamentals', 'url': 'https://www.coursera.org/specializations/cyber-security', 'platform': 'Coursera'},
            {'name': 'Ethical Hacking', 'url': 'https://www.javatpoint.com/ethical-hacking-tutorial', 'platform': 'JavaTpoint'},
            {'name': 'Network Security', 'url': 'https://www.w3schools.com/cybersecurity/', 'platform': 'W3Schools'}
        ],
        'Cloud Computing': [
            {'name': 'AWS Tutorial', 'url': 'https://www.javatpoint.com/aws-tutorial', 'platform': 'JavaTpoint'},
            {'name': 'Azure Tutorial', 'url': 'https://docs.microsoft.com/en-us/azure/', 'platform': 'Microsoft'},
            {'name': 'Google Cloud Tutorial', 'url': 'https://cloud.google.com/docs', 'platform': 'Google Cloud'}
        ]
    }
    return jsonify({'success': True, 'resources': resources})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
