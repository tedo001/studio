# **App Name**: Madurai CleanUp

## Core Features:

- Anonymous User Authentication: Enable users to log into the application instantly without needing to create an account, using Firebase Anonymous Authentication.
- Environmental Issue Image Capture: Allow users to capture a photograph directly within the app, specifically of an environmental issue they want to report.
- Secure Image Storage & URL Generation: Automatically upload captured images to Firebase Storage, ensuring they are securely stored, and then generate a unique public download URL for each uploaded image.
- Issue Reporting to Firestore: Submit a report containing the image download URL, a server timestamp, a severity level selected by the user, and a placeholder for an AI-generated category, to a Firestore collection named 'reports'.
- AI-Powered Category Suggestion Tool: Incorporate a feature where an AI tool (planned for Gemini API) analyzes the captured image to automatically suggest an 'aiCategory' for the environmental issue, streamlining the reporting process.
- Basic Report Display: Allow users to view a list of reports they have submitted, showing key details like the image and categories, providing an overview of their contributions.

## Style Guidelines:

- Primary color: A vibrant, earthy green (#4EAD1F) representing cleanliness and growth, providing good contrast on light backgrounds.
- Background color: A very light, almost white, subtle green tint (#F1F5F0) to maintain a fresh and clean aesthetic.
- Accent color: A warm, clear yellow-gold (#EBCE47) to highlight calls to action and indicate severity or important information, offering visual pop and energetic contrast.
- Headlines and body text font: 'PT Sans', a humanist sans-serif, selected for its modern feel, excellent readability, and a touch of warmth that suits a community-focused environmental app.
- Utilize simple, easily recognizable icons that are relevant to environmental actions, cleanup efforts, and community engagement, promoting clear understanding and ease of use.
- Implement a clean, intuitive layout with ample white space, prioritizing the clear display of image reports and direct interaction elements to facilitate quick reporting and information consumption, suitable for a hackathon MVP.
- Employ subtle and functional animations for user feedback, such as confirmation of image upload or report submission, ensuring a responsive and reassuring user experience without distractions.