import { useState } from 'react'
import {  Routes, Route } from 'react-router-dom'

function Signup() {
  return(
    <>
    <h2>Create an account</h2>
    <p>Start managing your budget today</p>
    <form id='sign'>
      <label for ="name">Name</label>
      <input type="text" id="name" placeholder="Enter your name" required></input><br></br>
      <label for ="email">Email</label>
      <input type="email" id="email" placeholder="Enter your email" required></input><br></br>
      <label for ="password">Password</label>
      <input type="password" id="password" placeholder="Enter your password" required></input>  
      <label for ="confirm">Confirm Password</label>
      <input type="password" id="confirm" placeholder="Confirm your password" required></input>
      <br></br><br></br>
    </form>
    </>
  )
}

export default Signup