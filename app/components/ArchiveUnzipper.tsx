"use client";
import { useState } from 'react';
import JSZip from 'jszip';

interface UnzippedFile {
  name: string;
  url: string;
}

const ArchiveUnzipper = () => {
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [unzippedFiles, setUnzippedFiles] = useState<UnzippedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleZipFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedZipFile(event.target.files?.[0] || null);
    setUnzippedFiles([]);
    setErrorMessage(null);
  };

  const handleUnzip = async () => {
    if (!selectedZipFile) {
      setErrorMessage('Будь ласка, виберіть ZIP-архів для розархівації.');
      return;
    }

    try {
      const zip = await JSZip.loadAsync(selectedZipFile);
      const files: UnzippedFile[] = [];
      for (const fileName in zip.files) {
        if (!zip.files[fileName].dir) {
          const blob = await zip.file(fileName)?.async('blob');
          if (blob) {
            const url = URL.createObjectURL(blob);
            files.push({ name: fileName, url });
          }
        }
      }
      setUnzippedFiles(files);
    } catch (error: any) {
      console.error('Помилка при розархівації архіву:', error);
      setErrorMessage('Виникла помилка при розархівації архіву. Можливо, файл пошкоджено або має непідтримуваний формат.');
      setUnzippedFiles([]);
    }
  };

  return (
    <div>
      <h2>Розархівувати ZIP-архів</h2>
      <input type="file" accept=".zip" onChange={handleZipFileChange} />
      <button onClick={handleUnzip} disabled={!selectedZipFile}>
        Розархівувати
      </button>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {unzippedFiles.length > 0 && (
        <div>
          <h3>Розпаковані файли:</h3>
          <ul>
            {unzippedFiles.map((file) => (
              <li key={file.name}>
                <a href={file.url} download={file.name}>
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ArchiveUnzipper;
