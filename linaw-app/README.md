# 📖 Linaw: Clarity While You Read

[cite_start]**Understand as you read.** [cite: 67, 68] [cite_start]Linaw reduces the friction between reading and comprehension by providing instant, localized explanations of complex academic jargon without breaking your focus[cite: 36, 69].

### 🏆 Hackathon Track
[cite_start]**SDG 4 - Quality Education** [cite: 4]

---

## ⚠️ The Problem
[cite_start]Many learners in non-native English speaking countries, like the Philippines, struggle to comprehend academic textbooks above their grade level[cite: 6]. [cite_start]When confronted with unfamiliar jargon, learners often feel alienated and resort to rote memorization just to pass exams, leading to poor knowledge retention[cite: 7, 8, 12]. 

[cite_start]The data is alarming: According to the EDCOM 2 Report: Turning Point, approximately 88% of learners are not equipped enough to be grade-level ready in reading[cite: 10]. [cite_start]This is heavily worsened by a language barrier, as learning resources in their mother tongue are limited[cite: 13].

## 💡 The Solution
Linaw is a Progressive Web App (PWA) that doesn't just translate; it **localizes**. [cite_start]Instead of direct word-for-word substitution, Linaw explains abstract ideas in native Philippine languages (like Cebuano) the way learners naturally think and reason[cite: 57, 88, 91, 99].

### ✨ Key Features
* [cite_start]**Contextual Highlighting:** The app analyzes uploaded academic PDFs and automatically highlights words that are above the user's grade level[cite: 39].
* [cite_start]**Explain As You Read:** Tap a highlighted word (e.g., "Psychology") to instantly see a localized Cebuano explanation (e.g., "Ang psychology mao ang pagtuon sa hunahuna ug pamatasan sa tawo")[cite: 70, 72, 73].
* [cite_start]**Visual Learning:** Explanations are supplemented with retrieved internet images or GIFs to make abstract concepts intuitive[cite: 43, 83, 85].

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
[cite_start]K-12 learners and college students in Philippine regions with strong local dialects who lack access to reading materials in their mother tongue and rely primarily on English resources[cite: 16].

---
*Built with ❤️ by Rocket*