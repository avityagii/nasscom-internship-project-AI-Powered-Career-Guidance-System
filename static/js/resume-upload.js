document.addEventListener('DOMContentLoaded', function() {
    const dropzone = document.getElementById('resumeDropzone');
    const fileInput = document.getElementById('resumeInput');
    const browseBtn = document.getElementById('browseFilesBtn');
    const skipBtn = document.getElementById('skipUploadBtn');
    const dropzoneContent = dropzone.querySelector('.dropzone-content');
    const uploadProgress = dropzone.querySelector('.upload-progress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const assessmentForm = document.getElementById('assessmentForm');
    const resultsSection = document.getElementById('results');
    const assessmentSection = document.querySelector('.py-5'); // Assessment form section

    // Show file browser when clicking the dropzone or browse button
    [dropzone, browseBtn].forEach(element => {
        element.addEventListener('click', () => fileInput.click());
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight dropzone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', handleDrop, false);

    // Handle file selection
    fileInput.addEventListener('change', handleFiles);

    // Skip to manual assessment
    skipBtn.addEventListener('click', () => {
        dropzone.closest('section').classList.add('d-none');
        assessmentSection.scrollIntoView({ behavior: 'smooth' });
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropzone.classList.add('border-primary');
    }

    function unhighlight() {
        dropzone.classList.remove('border-primary');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        const file = files[0];
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        // Validate file type
        if (!validTypes.includes(file.type)) {
            showAlert('Invalid file type. Please upload a PDF, DOCX, or TXT file.', 'danger');
            return;
        }

        // Validate file size
        if (file.size > maxSize) {
            showAlert('File is too large. Maximum size is 5MB.', 'danger');
            return;
        }

        // Show upload progress
        dropzoneContent.classList.add('d-none');
        uploadProgress.classList.remove('d-none');
        simulateUploadProgress();

        // In a real application, you would upload the file to your server here
        // For now, we'll simulate a successful upload
        setTimeout(() => {
            analyzeResume(file);
        }, 2000);
    }

    function simulateUploadProgress() {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                return;
            }
            width += 5;
            progressBar.style.width = width + '%';
        }, 100);
    }

    function analyzeResume(file) {
        // In a real application, you would send the file to your server for analysis
        // and receive career recommendations based on the resume content
        
        // Show loading state
        const loadingSpinner = document.getElementById('loadingSpinner');
        loadingSpinner.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
        
        // Simulate API call with timeout
        setTimeout(() => {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
            document.body.style.overflow = '';
            
            // In a real app, you would get this data from your backend
            const careerData = {
                title: 'Data Scientist',
                match: 92,
                description: 'Analyze complex data to extract insights and build predictive models using machine learning and statistical techniques.',
                salary: '₹14.3L+',
                growth: '31% Growth (2020-2030)',
                education: "Master's Degree",
                skills: ['Python', 'Machine Learning', 'Data Analysis', 'Statistics', 'Data Visualization', 'SQL'],
                responsibilities: [
                    'Develop and implement machine learning models',
                    'Analyze large datasets to extract insights',
                    'Create data visualizations and reports',
                    'Collaborate with cross-functional teams',
                    'Stay updated with latest data science trends'
                ],
                requirements: [
                    "Master's degree in Computer Science, Statistics, or related field",
                    'Proficiency in Python and data science libraries',
                    'Experience with machine learning frameworks',
                    'Strong analytical and problem-solving skills',
                    'Excellent communication and presentation skills'
                ]
            };
            
            // Update the UI with career data
            updateCareerResults(careerData);
            
            // Hide the upload section and show results
            dropzone.closest('section').classList.add('d-none');
            document.getElementById('results').classList.remove('d-none');
            document.getElementById('resultsSection').style.display = 'block';
            
            // Scroll to results
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
            
            // Auto-fill form fields based on resume (simulated)
            simulateAutoFill(careerData.skills);
            
        }, 2000); // Simulate 2 second processing time
    }
    
    function updateCareerResults(data) {
        // Update the career title and description
        document.getElementById('topCareerTitle').textContent = data.title;
        document.getElementById('topCareerDesc').textContent = data.description;
        
        // Update match percentage
        const matchBadge = document.querySelector('.match-badge');
        if (matchBadge) {
            matchBadge.innerHTML = `<i class="fas fa-check-circle me-2"></i>${data.match}% Match`;
        }
        
        // Update salary, growth, and education badges
        const badgeContainer = document.querySelector('.career-badges');
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <span class="badge bg-light text-dark border p-2 d-flex align-items-center">
                    <i class="fas fa-rupee-sign me-2 text-primary"></i>
                    <span>${data.salary}</span>
                </span>
                <span class="badge bg-light text-dark border p-2 d-flex align-items-center">
                    <i class="fas fa-chart-line me-2 text-success"></i>
                    <span>${data.growth}</span>
                </span>
                <span class="badge bg-light text-dark border p-2 d-flex align-items-center">
                    <i class="fas fa-graduation-cap me-2 text-info"></i>
                    <span>${data.education}</span>
                </span>`;
        }
        
        // Update skills
        const skillsContainer = document.querySelector('.skills-container');
        if (skillsContainer) {
            skillsContainer.innerHTML = data.skills.map(skill => 
                `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 me-2 mb-2">
                    <i class="fas fa-check-circle me-1"></i>${skill}
                </span>`
            ).join('');
        }
        
        // Update modal content
        document.getElementById('careerDetailsModalLabel').textContent = data.title;
        const modalSubtitle = document.querySelector('#careerDetailsModal .modal-header p');
        if (modalSubtitle) {
            modalSubtitle.textContent = data.description;
        }
        
        // Update salary and growth in modal
        const salaryElement = document.querySelector('#careerDetailsModal [data-field="salary"]');
        if (salaryElement) {
            salaryElement.textContent = data.salary;
        }
        
        const growthElement = document.querySelector('#careerDetailsModal [data-field="growth"]');
        if (growthElement) {
            growthElement.textContent = data.growth.split(' ')[0];
        }
        
        // Update responsibilities and requirements
        const responsibilitiesList = document.querySelector('#careerDetailsModal [data-list="responsibilities"]');
        if (responsibilitiesList) {
            responsibilitiesList.innerHTML = data.responsibilities
                .map(item => `<li class="mb-2"><i class="fas fa-check-circle text-success me-2"></i>${item}</li>`)
                .join('');
        }
        
        const requirementsList = document.querySelector('#careerDetailsModal [data-list="requirements"]');
        if (requirementsList) {
            requirementsList.innerHTML = data.requirements
                .map(item => `<li class="mb-2"><i class="fas fa-check-circle text-success me-2"></i>${item}</li>`)
                .join('');
        }
    }

    function simulateAutoFill(skills = ['Python', 'Data Analysis', 'Machine Learning', 'Statistics', 'SQL']) {
        // This is a simulation - in a real app, you would extract data from the resume
        // and fill the form fields accordingly
        
        // Find all skill select elements
        const skillFields = document.querySelectorAll('select[id$="_interest"]');
        
        // Fill up to 5 skill fields with the first 5 skills from the resume
        skills.slice(0, 5).forEach((skill, index) => {
            if (index < skillFields.length) {
                const field = skillFields[index];
                // Find the option that contains the skill (case insensitive)
                const option = Array.from(field.options).find(opt => 
                    opt.text.toLowerCase().includes(skill.toLowerCase())
                );
                
                // If exact match not found, try partial match
                if (!option) {
                    const partialMatch = Array.from(field.options).find(opt => 
                        skill.toLowerCase().includes(opt.text.toLowerCase()) || 
                        opt.text.toLowerCase().includes(skill.toLowerCase())
                    );
                    
                    if (partialMatch) {
                        partialMatch.selected = true;
                        const event = new Event('change');
                        field.dispatchEvent(event);
                    }
                } else {
                    option.selected = true;
                    // Trigger change event to update progress
                    const event = new Event('change');
                    field.dispatchEvent(event);
                }
            }
        });
        
        // Show a success message
        showAlert('We\'ve pre-filled some fields based on your resume. Please review and complete the assessment.', 'info');
    }

    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container');
        container.prepend(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
});
