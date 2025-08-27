import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface FileUpload {
  originalName: string
  buffer: Buffer
  mimetype: string
  size: number
}

export interface StoredFile {
  id: string
  originalName: string
  storedName: string
  mimetype: string
  size: number
  url: string
  path: string
}

export class FileStorageService {
  private baseUploadPath: string
  private baseUrl: string

  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'public', 'uploads')
    this.baseUrl = '/uploads'
    
    // Ensure upload directory exists
    this.ensureUploadDirExists()
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.baseUploadPath)) {
      fs.mkdirSync(this.baseUploadPath, { recursive: true })
    }

    // Create subdirectories for organization
    const subdirs = ['documents', 'images', 'temp']
    subdirs.forEach(subdir => {
      const subdirPath = path.join(this.baseUploadPath, subdir)
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true })
      }
    })
  }

  async uploadFile(file: FileUpload, departmentId?: string): Promise<StoredFile> {
    const fileId = randomUUID()
    const fileExtension = path.extname(file.originalName)
    const storedName = `${fileId}${fileExtension}`
    
    // Organize by department if provided
    const subPath = departmentId ? `documents/${departmentId}` : 'documents'
    const fullSubPath = path.join(this.baseUploadPath, subPath)
    
    // Ensure department directory exists
    if (!fs.existsSync(fullSubPath)) {
      fs.mkdirSync(fullSubPath, { recursive: true })
    }
    
    const filePath = path.join(fullSubPath, storedName)
    const relativeFilePath = path.join(subPath, storedName)
    
    // Save file to disk
    await fs.promises.writeFile(filePath, file.buffer)
    
    return {
      id: fileId,
      originalName: file.originalName,
      storedName: storedName,
      mimetype: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/${relativeFilePath.replace(/\\/g, '/')}`,
      path: relativeFilePath
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseUploadPath, filePath)
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  async getFileInfo(filePath: string): Promise<{ size: number; exists: boolean } | null> {
    try {
      const fullPath = path.join(this.baseUploadPath, filePath)
      const stats = await fs.promises.stat(fullPath)
      return {
        size: stats.size,
        exists: true
      }
    } catch (error) {
      return { size: 0, exists: false }
    }
  }

  generatePresignedUrl(filePath: string, expiresIn: number = 3600): string {
    // For local storage, we just return the direct URL
    // In production with S3, this would generate a presigned URL
    return `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`
  }

  async copyFile(sourceFilePath: string, destinationPath?: string): Promise<StoredFile | null> {
    try {
      const sourceFullPath = path.join(this.baseUploadPath, sourceFilePath)
      
      if (!fs.existsSync(sourceFullPath)) {
        return null
      }

      const fileId = randomUUID()
      const sourceFile = await fs.promises.readFile(sourceFullPath)
      const sourceStats = await fs.promises.stat(sourceFullPath)
      const originalName = path.basename(sourceFilePath)
      const fileExtension = path.extname(originalName)
      
      const storedName = `${fileId}${fileExtension}`
      const destPath = destinationPath || 'documents'
      const fullDestPath = path.join(this.baseUploadPath, destPath)
      
      if (!fs.existsSync(fullDestPath)) {
        fs.mkdirSync(fullDestPath, { recursive: true })
      }
      
      const newFilePath = path.join(fullDestPath, storedName)
      const relativeFilePath = path.join(destPath, storedName)
      
      await fs.promises.writeFile(newFilePath, sourceFile)
      
      return {
        id: fileId,
        originalName: originalName,
        storedName: storedName,
        mimetype: this.getMimeTypeFromExtension(fileExtension),
        size: sourceStats.size,
        url: `${this.baseUrl}/${relativeFilePath.replace(/\\/g, '/')}`,
        path: relativeFilePath
      }
    } catch (error) {
      console.error('Error copying file:', error)
      return null
    }
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    }
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  // Simulate S3-like functionality for production compatibility
  async listFiles(prefix: string = ''): Promise<StoredFile[]> {
    try {
      const searchPath = path.join(this.baseUploadPath, prefix)
      const files: StoredFile[] = []
      
      const scanDirectory = async (dir: string, relativePath: string = '') => {
        const items = await fs.promises.readdir(dir, { withFileTypes: true })
        
        for (const item of items) {
          const itemPath = path.join(dir, item.name)
          const relativeItemPath = path.join(relativePath, item.name)
          
          if (item.isDirectory()) {
            await scanDirectory(itemPath, relativeItemPath)
          } else if (item.isFile()) {
            const stats = await fs.promises.stat(itemPath)
            const extension = path.extname(item.name)
            
            files.push({
              id: path.parse(item.name).name,
              originalName: item.name,
              storedName: item.name,
              mimetype: this.getMimeTypeFromExtension(extension),
              size: stats.size,
              url: `${this.baseUrl}/${relativeItemPath.replace(/\\/g, '/')}`,
              path: relativeItemPath
            })
          }
        }
      }
      
      if (fs.existsSync(searchPath)) {
        await scanDirectory(searchPath, prefix)
      }
      
      return files
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }
}

// Singleton instance
export const fileStorage = new FileStorageService()

// Helper function to process file uploads from FormData
export function processFileUpload(file: File): FileUpload {
  return {
    originalName: file.name,
    buffer: Buffer.from(file.arrayBuffer() as any),
    mimetype: file.type,
    size: file.size
  }
}