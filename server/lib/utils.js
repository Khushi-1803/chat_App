// import jwt from 'jsonwebtoken'
// //function to generate a token for a user
// export const generateToken = (userId)=>{
//     const token = jwt.sign({userId},process.env.JWT_SECRET);
//     return token
// }


import jwt from 'jsonwebtoken';

// Function to generate a token for a user
export const generateToken = (userId) => {
  // Safety check: ensure secret is defined
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  // Sign the token with expiration
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Optional but recommended
  );

  return token;
};
