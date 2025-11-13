# AI Mentors 🤖

A modern, interactive chat application that allows developers to receive mentorship from AI personas of famous tech educators (Hitesh Choudhary & Piyush Garg). Built with the latest web technologies to ensure a smooth, responsive, and persistent chat experience.

## 🚀 Live Demo

**View the live project here:** [ https://ai-rnentors.vercel.app/]

---

## ✨ Key Features

-   **👤 Multi-Persona Chat:** Choose between different AI mentors with unique personalities and teaching styles.
-   **🔐 Secure Authentication:** Powered by **Clerk** for secure user sign-ups and logins.
-   **💾 Persistent History:** All conversations are saved to **MongoDB** via **Prisma**, allowing users to revisit past chats.
-   **🎨 Syntax Highlighting:** Beautifully rendered code blocks with language detection and copy functionality using `react-syntax-highlighter`.
-   **👀 Guest Mode:** Unregistered users can try the app with a limited free tier (3 messages) before signing up.
-   **📱 Responsive Design:** Fully optimized for mobile and desktop using **Tailwind CSS**.
-   **⚡ Markdown Support:** Rich text rendering for bolding, lists, and code formatting.

---

## 🛠️ Tech Stack

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Language:** JavaScript (ES6+)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication:** [Clerk](https://clerk.com/)
-   **Database:** [MongoDB](https://www.mongodb.com/)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **AI Model:** Gemini 2.5 Flash (via OpenAI Compatibility Layer)
-   **Icons:** [Lucide React](https://lucide.dev/)

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (MongoDB Connection String)
DATABASE_URL="mongodb+srv://..."

# AI Provider (Gemini/OpenAI Compatible)
OPENAI_API_KEY="your_api_key"
OPENAI_BASE_URL="your_base_url"
```

## 🚀 Getting Started

Follow these steps to set up the project locally:

1. **Clone the repository**
    ```bash
    git clone https://github.com/your-username/ai-mentors.git
    cd ai-mentors
    ```

## Install Dependencies

```bash
npm install
```

## Setup Database

Ensure your `.env` file has the correct `DATABASE_URL`, then push the schema to MongoDB:

```bash
npx prisma db push
```

## Run the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` with your browser to see the result.

## 🔮 Future Roadmap

We are constantly improving the application. Here are some exciting features coming soon:

-   **🌊 Real-Time Streaming:** Implementing Vercel AI SDK to allow responses to stream in character-by-character for a faster feel.
-   **📸 Image Analysis (Multimodal):** Allowing users to upload screenshots of code errors for the AI to debug visually.
-   **🎙️ Voice Mode:** Speak directly to the mentors using speech-to-text and text-to-speech integration.
-   **🧪 Live Code Sandbox:** An embedded code editor to run snippets directly within the chat interface.

---

## 🤝 Contributing

Contributions are always welcome! If you have any suggestions or improvements:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License.
