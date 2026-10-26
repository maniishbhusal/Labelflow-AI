# Product Requirements Document (PRD)

## Project: AI Dataset Labeling Studio

**Working name:** LabelFlow AI  
**Product type:** Full-stack AI web application  
**Primary goal:** Build a portfolio project demonstrating AI model deployment, backend engineering, and frontend development.

## 1. What is this project?

LabelFlow AI is a web application that helps users label images for computer vision projects.

When developers build AI systems that recognize objects in images, they often need labeled examples to train or evaluate their models.

For example, a developer building a car detection system needs images where cars are identified with bounding boxes and labels.

LabelFlow AI uses the pretrained WeVisOne-VL model to generate initial annotations automatically. Users can review those annotations, correct mistakes, and export the results as a dataset.

**In simple terms:** Upload images → Generate labels using AI → Correct the labels → Export the dataset.

## 2. What problem does it solve?

Manually labeling images can be repetitive and time-consuming.

A person may need to open hundreds of images, draw rectangles around objects, and assign labels individually.

LabelFlow AI aims to reduce this manual work by automatically generating initial annotations.

The application will also help users:
- Keep images and annotations organized.
- Correct inaccurate or missing labels.
- Maintain consistent annotation formats.
- Export datasets for use in other computer vision projects.

The AI will not always be correct. Human review remains an important part of the workflow.

## 3. Who is it for?

The initial target users are:
- Computer vision students.
- Developers experimenting with object detection.
- Researchers preparing image datasets.
- Small teams building computer vision prototypes.

The first version is a portfolio project. Finding paying customers is not a requirement.

## 4. Main user workflow

1. The user opens the application.
2. The user creates a project.
3. The user uploads one or more images.
4. The user selects the objects they want to label, such as cars or pedestrians.
5. The application sends the image and task to the WeVisOne-VL inference code.
6. The application displays the generated bounding boxes and labels.
7. The user reviews the results and corrects mistakes.
8. The user saves the annotations.
9. The user exports the dataset as JSON, using a documented annotation schema compatible with the intended downstream workflow.

## 5. Core features for version 1

### A. Image upload
- Upload JPG, JPEG, and PNG images.
- Display uploaded images in a project gallery.
- Validate file types, file sizes, and image dimensions.

### B. AI-assisted annotation
- Enter the objects to identify, such as cars or pedestrians.
- Run inference using WeVisOne-VL.
- Display detected objects and their bounding boxes.
- Show the current processing status and any errors.

### C. Annotation editor
- Display bounding boxes over the original image.
- Allow users to move and resize boxes.
- Allow users to change object labels.
- Allow users to delete incorrect annotations.
- Allow users to add missing boxes manually.

### D. Project and annotation management
- Save images and their annotations.
- Reopen previously labeled images.
- Track whether annotations are pending review or completed.

### E. Dataset export
- Export corrected annotations as JSON.
- Include image information, labels, and bounding-box coordinates.
- Document the exported schema.
- Validate the output before allowing downloads.

## 6. Technology stack

**Frontend**
- React
- TypeScript
- Tailwind CSS

**Backend**
- Python
- Django
- Django REST Framework

**AI**
- Tencent WeVisOne-VL pretrained model
- PyTorch and the model's required dependencies

**Database**
- PostgreSQL

**Image storage**
- Local storage during development.
- Object storage when deploying, if needed.

**Deployment**
- Docker for reproducible environments.
- A suitable GPU environment for model inference.
- Hosted frontend and backend services.

The model can initially run within the Python application if the environment supports it. A separate inference service can be introduced later if needed.

## 7. Initial API endpoints

- `POST /api/projects/` — Create a project.
- `GET /api/projects/` — List projects.
- `POST /api/projects/{id}/images/` — Upload an image.
- `POST /api/images/{id}/annotate/` — Request AI-generated annotations.
- `GET /api/jobs/{id}/` — Check annotation job status.
- `GET /api/images/{id}/annotations/` — Retrieve annotations.
- `PATCH /api/annotations/{id}/` — Update an annotation.
- `DELETE /api/annotations/{id}/` — Delete an annotation.
- `POST /api/images/{id}/annotations/manual/` — Add a manual annotation.
- `GET /api/projects/{id}/export/` — Export the project's annotations.

These are proposed endpoint designs. Their exact request and response formats will be defined during implementation.

## 8. Basic data model

The application will initially need these entities:

**Project**
- ID
- Name
- Created date

**Image**
- ID
- Project ID
- File location
- Original filename
- Width and height
- Processing status

**Annotation**
- ID
- Image ID
- Object label
- Bounding-box coordinates
- Source: AI-generated or manually created
- Review status

**Analysis Job**
- ID
- Image ID
- Status
- Error details, if any
- Processing timestamps

The database will store image metadata and annotations. Image files can be stored separately.

## 9. Out of scope for version 1

To keep the project manageable, the first version will not include:
- User subscriptions or payments.
- Team collaboration and shared workspaces.
- Model training or fine-tuning.
- Video annotation.
- Advanced segmentation editing.
- Multiple annotation formats beyond the initial documented JSON export.
- Enterprise-scale dataset management.

These features can be considered after the core application works.

## 10. Non-functional requirements

- Uploaded images must be validated.
- Users must not be able to access another user's private data if authentication is introduced.
- Long-running inference should not make the application unresponsive.
- Failed jobs should display understandable error messages.
- Annotation coordinates must be valid for the original image dimensions.
- Exported datasets must be valid according to the documented schema.
- The application should include basic automated tests and setup instructions.

## 11. Success criteria

Version 1 is complete when:

1. A user can create a project and upload an image.
2. The pretrained model successfully generates annotations for supported tasks.
3. The user can view, edit, add, and delete bounding boxes.
4. The application saves annotations and retrieves them later.
5. The user can export a valid JSON dataset.
6. The application runs from documented setup instructions.
7. A deployed demo or recorded demonstration shows the complete workflow.

## 12. Portfolio deliverables

The finished project should include:
- A working application or live demo.
- A public GitHub repository.
- A clear README with setup instructions.
- An architecture diagram.
- API documentation.
- A short demonstration video.
- Measured inference latency and a small evaluation of annotation quality.

## 13. Development approach

Build the project incrementally.

**Milestone 1:** Run WeVisOne-VL on one image and inspect its actual outputs.

**Milestone 2:** Create a Django REST Framework endpoint that returns those outputs.

**Milestone 3:** Build the image upload and annotation viewer.

**Milestone 4:** Implement editing and persistence.

**Milestone 5:** Implement JSON export.

**Milestone 6:** Test, deploy, document, and publish the project.

## Final product vision

LabelFlow AI should demonstrate how an existing AI model can become a useful software application through thoughtful backend design, a practical user interface, data management, and deployment.

The focus is not on training a new AI model. The focus is on building the complete system around a pretrained model.