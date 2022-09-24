import { convertFromDirectory } from 'joi-to-typescript'
import path from 'path'

convertFromDirectory({
    schemaDirectory: path.resolve(__dirname, '../validate/schema'),
    typeOutputDirectory: path.resolve(__dirname, '../validate/interfaces')
})