# Secure File Storage

## About the Project

Secure File Storage is a college minor project that allows users to store files in encrypted form.

The main idea behind this project is to protect files before uploading them to the server. Files are encrypted directly in the browser, so the original file and password are never sent to the backend.

Users can upload encrypted files, view their stored files, download them when needed, and recover the original file using the correct password.

## Technologies Used

- **Frontend:** React.js and Vite
- **Backend:** Node.js and Express.js
- **File Upload:** Multer
- **Encryption:** Web Crypto API
- **Encryption Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with SHA-256

## How It Works

1. Select a file from your computer. The application supports different file types.
2. Enter a password and click **Encrypt & Upload**.
3. The file is encrypted in the browser and only the encrypted `.sfs` file is uploaded to the server.
4. After uploading, the file appears in the **My Stored Files** section with its size and upload date.
5. Click **Download** to get the encrypted file and enter the same password to decrypt it.
6. The original file is recovered with its original name and content.
7. If a file is no longer needed, it can be deleted from the server using the Delete option.

The application also provides an option to encrypt and download a file without uploading it.

## Supported File Types

The application can work with different file types because it reads files as raw bytes instead of treating them as text.

Some examples include:

- PDF and Word documents
- Excel files and CSV
- JPG, PNG and other images
- MP3 and WAV audio files
- MP4 videos
- TXT files
- Other file formats

After decryption, the original file name and content are restored.

**Maximum file size:** 20 MB per file.

## Project Structure

```text
Minor-Project/
│
├── Backend/
│   ├── config/
│   │   └── upload.js
│   ├── controllers/
│   │   └── fileController.js
│   ├── middleware/
│   │   ├── validateEncryptedFile.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── fileRoutes.js
│   ├── utils/
│   │   └── sfsFormat.js
│   ├── uploads/
│   └── server.js
│
└── Frontend/
    └── src/
        ├── components/
        ├── services/
        │   └── fileService.js
        ├── utils/
        │   ├── fileEncryption.js
        │   ├── downloadFile.js
        │   └── formatFileSize.js
        ├── styles/
        │   └── App.css
        ├── App.jsx
        └── main.jsx
```

## How to Run the Project

Make sure Node.js is installed on your computer.

**1. Start the backend**

```bash
cd Backend
npm install
npm run dev
```

The backend runs on port 3000.

**2. Start the frontend**

Open another terminal and run:

```bash
cd Frontend
npm install
npm run dev
```

The frontend normally runs on port 5173.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/files` | Get the list of stored files |
| POST | `/api/files/upload` | Upload an encrypted file |
| GET | `/api/files/:fileId` | Download a stored file |
| DELETE | `/api/files/:fileId` | Delete a stored file |

## Encryption Details

The project uses AES-256-GCM to encrypt and decrypt files.

- A 256-bit encryption key is generated using PBKDF2.
- PBKDF2 uses SHA-256 with 310,000 iterations.
- A random 16-byte salt is generated for each file.
- A random 12-byte IV is used for encryption.
- AES-GCM also checks whether the encrypted data has been modified.

The original file name is stored in the encrypted file header so that it can be recovered during decryption.

## Encrypted File Format

The application uses its own `.sfs` file format.

```text
SFS1
Version
Original File Name
Salt (16 bytes)
IV (12 bytes)
Encrypted File Data
```

The header information is also authenticated during encryption. This helps detect changes to the stored file information.

Files created using the older format are still supported for local decryption.

## Tests

The encryption and decryption logic is tested using Node.js built-in test runner.

Run these commands from the Frontend folder:

```bash
npm test
npm run lint
npm run build
```

The current encryption test suite contains 12 tests covering file encryption, decryption, binary data, wrong passwords, modified files and older file formats.

## Limitations

This project is currently developed for learning and college evaluation purposes. Some features still need to be added before it can be used as a production application.

- There is no login or user authentication yet.
- All users who can access the backend can view and manage stored files.
- If a user forgets the password, the original file cannot be recovered.
- HTTPS is not configured for the current local setup.
- There is no automatic backup or file recovery system.
- File size is limited to 20 MB.
- Files are processed in memory during encryption and decryption.

## Future Improvements

In the future, the project can be improved by adding:

- User registration and login.
- Separate file storage for each user.
- Cloud storage support.
- Better file management options.
- File size and storage limit management.
- HTTPS and additional security improvements.
- A responsive design for mobile devices.

## Conclusion

Through this project, I have worked on file encryption, decryption, file uploads and backend file management. It helped me understand how encryption can be used to protect files before storing them on a server.

The current version covers the basic working process, and more features can be added in the future.