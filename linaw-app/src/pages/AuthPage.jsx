import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";
import { auth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { createNotebook } from "../services/notebookService";


export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      } else {
        // REGISTER
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        // Save full name
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Save user document
        await setDoc(doc(db, "users", user.uid), {
          name: fullName,
          email: email,
          createdAt: new Date()
        });


        await createNotebook(user.uid, "Getting Started");

        navigate("/");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>
          <span>Linaw</span> {isLogin ? "Login" : "Register"}
        </h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn primary" onClick={handleSubmit}>
          {isLogin ? "Login" : "Create Account"}
        </button>

        <p className="switch-text">
          {isLogin
            ? "Don’t have an account?"
            : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
}