// Career Guidance System - Frontend JavaScript

class CareerGuidanceApp {
    constructor() {
        this.assessmentForm = document.getElementById('assessmentForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.careerResults = document.getElementById('careerResults');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.learningResources = document.getElementById('learningResources');
        
        // Only initialize modal if it exists
        const modalElement = document.getElementById('careerModal');
        if (modalElement) {
            this.careerModal = new bootstrap.Modal(modalElement);
        }
        
        this.init();
    }

    init() {
        this.bindEvents();
        // Only load learning resources if the element exists
        if (this.learningResources) {
            this.loadLearningResources();
        }
        this.addSmoothScrolling();
    }

    bindEvents() {
        // Assessment form submission
        if (this.assessmentForm) {
            this.assessmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitAssessment();
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    async submitAssessment() {
        console.log('Form submission started');
        if (!this.assessmentForm) {
            const error = 'Assessment form not found';
            console.error(error);
            this.showError(error);
            return;
        }
        
        try {
            console.log('Showing loading spinner');
            this.showLoading();
            
            // Collect form data
            const formData = new FormData(this.assessmentForm);
            const ratings = {};
            
            console.log('Collected form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`- ${key}: ${value}`);
                ratings[key] = value;
            }
            
            // Validate that we have ratings
            if (Object.keys(ratings).length === 0) {
                const error = 'Please complete the assessment before submitting';
                console.error(error);
                this.showError(error);
                return;
            }

            console.log('Sending request to /predict endpoint');
            // Send to backend
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ratings })
            });

            console.log('Received response, parsing JSON');
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                console.log('Displaying results');
                this.displayResults(data);
                this.showResultsSection();
            } else {
                const error = data.error || 'An error occurred during prediction';
                console.error('Prediction error:', error);
                this.showError(error);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(data) {
        console.log('Displaying results with data:', data);
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from server');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'Prediction failed');
            }
            
            const { predictions = [], model_accuracy = 0, model_performance = {}, real_time_metrics = {} } = data;
            
            // Ensure we have predictions
            if (!Array.isArray(predictions)) {
                console.warn('Invalid predictions format, defaulting to empty array');
                predictions = [];
            }
            
            if (predictions.length === 0) {
                console.warn('No predictions received from the server');
            }

            // Update top career match
            if (predictions.length > 0) {
                const topCareer = predictions[0];
                const topCareerTitle = document.getElementById('topCareerTitle');
                const topCareerDesc = document.getElementById('topCareerDesc');
                const matchPercentage = document.querySelector('.badge.bg-success');
                
                if (topCareerTitle) topCareerTitle.textContent = topCareer.name;
                if (topCareerDesc) topCareerDesc.textContent = topCareer.info?.description || 'No description available';
                if (matchPercentage) {
                    matchPercentage.innerHTML = `<i class="fas fa-check-circle me-1"></i> ${Math.round(topCareer.confidence * 100)}% Match`;
                }

                // Update salary and education info if available
                const salaryBadge = document.querySelector('.badge.bg-light:first-child');
                const growthBadge = document.querySelectorAll('.badge.bg-light')[1];
                const educationBadge = document.querySelectorAll('.badge.bg-light')[2];
                
                if (salaryBadge && topCareer.info?.salary_range) {
                    salaryBadge.innerHTML = `<i class="fas fa-dollar-sign me-1"></i> ${topCareer.info.salary_range.split('-')[0].trim()}+`;
                }
                if (growthBadge && topCareer.info?.growth_path) {
                    growthBadge.innerHTML = `<i class="fas fa-chart-line me-1"></i> 22% Growth`;
                }
                if (educationBadge) {
                    educationBadge.innerHTML = `<i class="fas fa-graduation-cap me-1"></i> ${topCareer.info?.education_required || 'Bachelor\'s Degree'}`;
                }
            }

            // Update other career matches
            const otherCareersContainer = document.getElementById('otherCareers');
            if (otherCareersContainer) {
                otherCareersContainer.innerHTML = ''; // Clear existing content
                
                // Start from index 1 to skip the top career
                predictions.slice(1, 4).forEach((career, index) => {
                    const careerCard = document.createElement('div');
                    careerCard.className = 'col-md-6 col-lg-4 mb-4';
                    careerCard.innerHTML = `
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div class="bg-primary bg-opacity-10 p-2 rounded">
                                        <i class="fas ${this.getCareerIcon(career.name)} text-primary"></i>
                                    </div>
                                    <span class="badge bg-success bg-opacity-10 text-success">
                                        ${Math.round(career.confidence * 100)}% Match
                                    </span>
                                </div>
                                <h5 class="mb-2">${career.name}</h5>
                                <p class="text-muted small mb-3">${career.info?.description?.split('.')[0] || 'No description available'}.</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-primary fw-bold">${career.info?.salary_range?.split('-')[0].trim() || '$0+'}</span>
                                    <button class="btn btn-sm btn-outline-primary" onclick="app.showCareerDetails('${career.name.replace("'", "\\'")}')">
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    otherCareersContainer.appendChild(careerCard);
                });
            }

            // Update model accuracy display
            this.updateModelAccuracy(data);
            
            // Show the results section
            document.getElementById('results').classList.remove('d-none');
            document.getElementById('assessmentForm').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error displaying results:', error);
            this.showError('Failed to display results. Please try again.');
        }
        
        // Animate progress bars
        this.animateProgressBars();
    }

    getCareerIcon(careerName) {
        const iconMap = {
            'Data Scientist': 'brain',
            'Software Developer': 'code',
            'Cloud Engineer': 'cloud',
            'Cybersecurity Analyst': 'shield-alt',
            'Web Developer': 'globe',
            'AI/ML Engineer': 'robot',
            'Network Architect': 'network-wired',
            'Database Administrator': 'database'
        };
        return iconMap[careerName] || 'briefcase';
    }

    updateModelAccuracy(data) {
        console.log('Updating model accuracy with:', data);
        
        // Get model accuracy from the response data
        const modelAccuracy = data.model_accuracy || 0;
        const modelAccuracyPercentage = Math.round(modelAccuracy * 100);
        
        // Update the accuracy display
        const accuracyElement = document.getElementById('modelAccuracy');
        const accuracyBar = document.getElementById('modelAccuracyBar');
        
        if (accuracyElement) {
            accuracyElement.textContent = `${modelAccuracyPercentage}%`;
        }
        
        if (accuracyBar) {
            accuracyBar.style.width = `${modelAccuracyPercentage}%`;
            accuracyBar.setAttribute('aria-valuenow', modelAccuracyPercentage);
            
            // Update color based on accuracy level
            if (modelAccuracyPercentage >= 80) {
                accuracyBar.className = 'progress-bar bg-success';
            } else if (modelAccuracyPercentage >= 60) {
                accuracyBar.className = 'progress-bar bg-primary';
            } else {
                accuracyBar.className = 'progress-bar bg-warning';
            }
        }
        
        // If we have real-time metrics, show additional information
        if (data.real_time_metrics) {
            console.log('Real-time metrics:', data.real_time_metrics);
            // You can add more real-time metrics display here if needed
        }
    }

    animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar[data-width]');
        progressBars.forEach((bar, index) => {
            setTimeout(() => {
                const width = bar.getAttribute('data-width');
                bar.style.width = width;
                bar.style.transition = 'width 1s ease-in-out';
            }, index * 200);
        });
    }

    createCareerCard(career, rank) {
        const card = document.createElement('div');
        card.className = `career-card rank-${rank} position-relative slide-up`;
        const progressBarClass = career.confidence > 0.7 ? 'bg-success' : career.confidence > 0.5 ? 'bg-primary' : 'bg-warning';
        const percentage = Math.round(career.confidence * 100);
        const description = career.info?.description || 'No description available';
        const shortDescription = description.length > 120 ? `${description.substring(0, 120)}...` : description;
        
        card.innerHTML = `
            <div class="career-rank">${rank}</div>
            <div class="text-center mb-3">
                <i class="fas ${this.getCareerIcon(career.name)} fa-3x text-primary mb-3"></i>
                <h4 class="fw-bold">${career.name}</h4>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold">Match Score</span>
                    <span class="badge ${progressBarClass}">${percentage}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar ${progressBarClass}" 
                         role="progressbar" 
                         style="width: 0%" 
                         data-width="${percentage}%"
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${percentage}%
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <p class="text-muted small">${shortDescription}</p>
            </div>
            <div class="text-center">
                <button class="btn btn-outline-primary btn-sm" 
                        onclick="app.showCareerDetails('${career.name.replace("'", "\\'")}')">
                    <i class="fas fa-info-circle me-1"></i> Learn More
                </button>
            </div>`;
            
        // Animate progress bar after the element is added to the DOM
        setTimeout(() => {
            const progressBar = card.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = progressBar.getAttribute('data-width');
                progressBar.style.transition = 'width 1s ease-in-out';
            }
        }, 100);
        
        return card;
    }

    async showCareerDetails(careerName) {
        try {
            const response = await fetch(`/career/${encodeURIComponent(careerName)}`);
            const data = await response.json();
            
            if (data.success) {
                this.populateCareerModal(careerName, data.career);
                this.careerModal.show();
            } else {
                this.showError('Career details not found');
            }
        } catch (error) {
            console.error('Error fetching career details:', error);
            this.showError('Error loading career details');
        }
    }

    populateCareerModal(careerName, careerInfo) {
        const modalTitle = document.getElementById('careerModalTitle');
        const modalBody = document.getElementById('careerModalBody');
        
        modalTitle.textContent = careerName;
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-12 mb-4">
                    <h5><i class="fas fa-info-circle text-primary me-2"></i>Role Description</h5>
                    <p>${careerInfo.description}</p>
                </div>
                
                <div class="col-md-6 mb-4">
                    <h5><i class="fas fa-cogs text-success me-2"></i>Required Skills</h5>
                    <div class="skill-tags">
                        ${careerInfo.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <h5><i class="fas fa-laptop-code text-info me-2"></i>Technologies</h5>
                    <div class="tech-tags">
                        ${careerInfo.technologies.map(tech => `<span class="skill-tag tech-tag">${tech}</span>`).join('')}
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <h5><i class="fas fa-dollar-sign text-warning me-2"></i>Salary Range</h5>
                    <p class="fs-5 fw-bold text-success">${careerInfo.salary_range}</p>
                </div>
                
                <div class="col-md-6 mb-4">
                    <h5><i class="fas fa-building text-secondary me-2"></i>Top Companies</h5>
                    <div class="company-list">
                        ${careerInfo.companies.map(company => `<span class="company-badge">${company}</span>`).join('')}
                    </div>
                </div>
                
                <div class="col-12">
                    <h5><i class="fas fa-chart-line text-primary me-2"></i>Career Growth Path</h5>
                    <div class="alert alert-light">
                        <p class="mb-0">${careerInfo.growth_path}</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadLearningResources() {
        try {
            const response = await fetch('/learning-resources');
            const data = await response.json();
            
            if (data.success) {
                this.displayLearningResources(data.resources);
            }
        } catch (error) {
            console.error('Error loading learning resources:', error);
        }
    }

    displayLearningResources(resources) {
        try {
            const container = document.getElementById('resourcesContainer');
            if (!container) {
                console.error('Resources container not found');
                return;
            }

            if (!Array.isArray(resources) || resources.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">No learning resources available at the moment.</div>';
                return;
            }

            let html = '';
            
            resources.forEach(resource => {
                if (!resource || !resource.title) return; // Skip invalid resources
                
                const icon = this.getCategoryIcon(resource.category || 'Programming');
                const difficulty = resource.difficulty || 'Beginner';
                const category = resource.category || 'General';
                
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-${icon} me-2"></i>
                                    ${resource.title}
                                </h5>
                                <p class="card-text">${resource.description || 'No description available.'}</p>
                                <a href="${resource.url || '#'}" ${resource.url ? 'target="_blank"' : ''} 
                                   class="btn btn-outline-primary btn-sm ${!resource.url ? 'disabled' : ''}">
                                    View Resource <i class="fas fa-external-link-alt ms-1"></i>
                                </a>
                            </div>
                            <div class="card-footer text-muted">
                                <small>${category} • ${difficulty}</small>
                            </div>
                        </div>
                    </div>`;
            });
            
            container.innerHTML = html || '<div class="col-12 text-center text-muted">No resources to display.</div>';
        } catch (error) {
            console.error('Error displaying learning resources:', error);
            const container = document.getElementById('resourcesContainer');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load learning resources. Please try again later.
                    </div>`;
            }
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Web Development': 'globe',
            'Programming': 'code',
            'Database': 'database',
            'AI/ML': 'brain',
            'Cybersecurity': 'shield-alt',
            'Cloud Computing': 'cloud'
        };
        return icons[category] || 'book';
    }

    showResultsSection() {
        console.log('Showing results section');
        try {
            // Show the results section by removing the 'd-none' class
            const resultsContainer = document.getElementById('results');
            if (resultsContainer) {
                resultsContainer.classList.remove('d-none');
            }
            
            // Show the results section content
            if (this.resultsSection) {
                this.resultsSection.style.display = 'block';
                this.scrollToResults();
                
                // Load learning resources after a short delay to ensure UI is updated
                setTimeout(() => {
                    this.loadLearningResources();
                }, 300);
            } else {
                console.error('Results section element not found');
            }
        } catch (error) {
            console.error('Error showing results section:', error);
            this.showError('Failed to display results section.');
        }
    }

    scrollToResults() {
        if (this.resultsSection) {
            setTimeout(() => {
                this.resultsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }
    }

    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('d-none');
            document.body.style.overflow = 'hidden';
        }
    }

    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('d-none');
            document.body.style.overflow = 'auto';
        }
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast element after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    addSmoothScrolling() {
        // Add smooth scrolling behavior to all internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CareerGuidanceApp();
});

// Add some utility functions for enhanced UX
document.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('shadow');
    } else {
        navbar.classList.remove('shadow');
    }
});

// Add form validation feedback
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assessmentForm');
    const selects = form.querySelectorAll('select');
    
    selects.forEach(select => {
        select.addEventListener('change', () => {
            if (select.value) {
                select.classList.add('is-valid');
                select.classList.remove('is-invalid');
            } else {
                select.classList.add('is-invalid');
                select.classList.remove('is-valid');
            }
        });
    });
});
