import Users from '../models/userModel.js'
import { compareString, createJWT, hashString } from '../utils/index.js'
import { sendVerificationEmail } from '../utils/sendEmail.js'


export const register = async (req, res, next) => {
    const {firstName, lastName, email, password} = req.body
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({msg: 'Please fill in all fields.'})
    }
    try {
        const userExist = await Users.findOne({email})
        if (userExist) {
            return res.status(400).json({msg: 'This email already exists.'})
        }
        const hashedPassword = await hashString(password)

        const user = new Users({
            firstName,
            lastName,
            email,
            password: hashedPassword
        })
        
        sendVerificationEmail(user, res) 
        await user.save()
    } catch (error) {
        return res.status(404).json({msg: error.message})
        
    }
}

export const login = async (req, res, next) => {
    const {email, password} = req.body

    try {
        if (!email || !password) {
            return res.status(400).json({msg: 'Please fill in all fields.'})
        }
        const user = await Users.findOne({email}).select('+password').populate({
            path: "friends",
            select: "firstName lastName location profileUrl -password"
        })
        if (!user) {
            return res.status(400).json({msg: 'Invalid email or password.'})
        }
        if (!user.verified) {
            return res.status(400).json({msg: 'Please verify your email before logging in.'})
        }

        //compare password
        const isMatch = await compareString(password, user?.password)
        if (!isMatch) {
            return res.status(400).json({msg: 'Invalid email or password.'})
        }
        user.password = undefined
        const token = createJWT(user?._id)

        res.status(201).json({
            success: true,
            message: 'Login successful.',
            user,
            token   
        })
        
    } catch (error) {
        console.log(error)
        return res.status(404).json({msg: error.message})
    }

}