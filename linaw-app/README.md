# 📖 Linaw: Clarity While You Read

**Understand as you read.** Linaw reduces the friction between reading and comprehension by providing instant, localized explanations of complex academic jargon without breaking your focus.

### 🏆 Hackathon Track
**SDG 4 - Quality Education**

---

## ⚠️ The Problem
Many learners in non-native English speaking countries, like the Philippines, struggle to comprehend academic textbooks above their grade level. When confronted with unfamiliar jargon, learners often feel alienated and resort to rote memorization just to pass exams, leading to poor knowledge retention. 

The data is alarming: According to the EDCOM 2 Report: Turning Point, approximately 88% of learners are not equipped enough to be grade-level ready in reading. This is heavily worsened by a language barrier, as learning resources in their mother tongue are limited.

## 💡 The Solution
Linaw is a Progressive Web App (PWA) that doesn't just translate; it **localizes**. Instead of direct word-for-word substitution, Linaw explains abstract ideas in native Philippine languages (like Cebuano) the way learners naturally think and reason.

### ✨ Key Features
* **Contextual Highlighting:** The app analyzes uploaded academic PDFs and automatically highlights words that are above the user's grade level.
* **Explain As You Read:** Tap a highlighted word (e.g., "Psychology") to instantly see a localized Cebuano explanation (e.g., "Ang psychology mao ang pagtuon sa hunahuna ug pamatasan sa tawo").
* **Visual Learning:** Explanations are supplemented with retrieved internet images or GIFs to make abstract concepts intuitive.

---

## 🛠️ Tech Stack

**Frontend Layer**
* **Framework:** React + Vite 
* **Styling:** Tailwind CSS + shadcn/ui
* **Document Rendering:** `@react-pdf-viewer/core` & `@react-pdf-viewer/highlight`
* **PWA:** `vite-plugin-pwa`

**AI & Data Layer**
* **Language Model:** (TBD)
* **Visuals:** Giphy / Unsplash API
* **Audio:** Native Browser Web Speech API (`SpeechSynthesis`)

**Backend Layer**
* **BaaS:** Firebase

---

## 🚀 Getting Started (Local Development)

To run Linaw locally on your machine, follow these steps:

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/linaw.git](https://github.com/your-username/linaw.git)
    cd linaw
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory and add your API keys:
    ```env
    ```

4.  **Start the Vite Development Server**
    ```bash
    npm run dev
    ```

---

## 🎯 Target Users
K-12 learners and college students in Philippine regions with strong local dialects who lack access to reading materials in their mother tongue and rely primarily on English resources.

---
*Built with ❤️ by Rocket*