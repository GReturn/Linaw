import { useState } from "react";
import "./AuthPage.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>
          <span>Linaw</span> {isLogin ? "Login" : "Register"}
        </h2>

        {!isLogin && (
          <input type="text" placeholder="Full Name" />
        )}

        <input type="email" placeholder="Email Address" />
        <input type="password" placeholder="Password" />

        <button className="btn primary">
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