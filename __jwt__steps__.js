/**
 * Install jsonwebtoken
 * jwt.sign(payload, secret, {expiresIn: })
 * send token to client
 * 
*/

/**
 * How to store token in the client side
 * 1. memory --> ok type
 * 2. local storage --> ok type (XSS)
 * 3. cookies: http only
 * 
*/

/**
 * 1. Set cookies with http only. For development secure: false
 * 
 * 2. Cors (Important)
 * app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
    }));
*
* 3. Client side Axios settings
     in axios set withCredentials: true
*
* 4. To send cookies from the client make sure you added withCredentials: true for the API call using axios
* 5. Use cookie parser as middleware
*
*/