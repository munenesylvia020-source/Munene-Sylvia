import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Signup(){

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = (e)=>{
    e.preventDefault();
    console.log("Signup",name,email,password);
  }

  return(

    <div className="auth-container">

      <div className="auth-card">

        <h1 className="app-title">Create Account</h1>
        <p className="subtitle">Start managing your HELB smarter.</p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Your username"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>

          <button className="primary-btn">Create Account</button>

          <p className="switch-text">
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>

        </form>

      </div>

    </div>

  )
}

export default Signup;
