import { Router } from 'express'
import { generateSnippets, getLanguages } from '../controllers/snippetController.js'

const router = Router()

router.get('/languages', getLanguages)
router.post('/generate', generateSnippets)

export default router
