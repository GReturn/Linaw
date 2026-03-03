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
import { useSearchParams } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [isLogin, setIsLogin] = useState(mode !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const userRef = doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          name: user.displayName,
          email: user.email,
          createdAt: new Date()
        },
        { merge: true } // prevents overwriting existing users
      );

      await createNotebook(user.uid, "Getting Started");

      navigate("/notebook/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/notebook/dashboard");
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

        <button className="google-btn" onClick={handleGoogleAuth}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="google-icon"
          />
          <span>Continue with Google</span>
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