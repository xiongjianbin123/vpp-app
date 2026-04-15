import { useState } from 'react';
import { Upload, Button, Tag, message } from 'antd';
import { UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { uploadAgentFile } from '../../services/agentApi';

interface FileUploadProps {
  agentKey: string;
  onUploadComplete: (dataId: string, preview: Record<string, unknown>[]) => void;
}

export default function FileUpload({ agentKey, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ fileName: string; rowCount: number; columns: string[] } | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const result = await uploadAgentFile(agentKey, file);
    setUploading(false);

    if (result.success && result.dataId) {
      setUploadResult({ fileName: result.fileName!, rowCount: result.rowCount!, columns: result.columns! });
      onUploadComplete(result.dataId, result.preview || []);
      message.success(`已上传 ${result.fileName}（${result.rowCount} 行）`);
    } else {
      message.error(result.error || '上传失败');
    }
    return false; // prevent default upload
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Upload
        accept=".xlsx,.xls,.csv"
        showUploadList={false}
        beforeUpload={handleUpload}
      >
        <Button icon={<UploadOutlined />} loading={uploading} size="small">
          导入数据 (Excel/CSV)
        </Button>
      </Upload>
      {uploadResult && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#8899aa' }}>
          <FileExcelOutlined style={{ color: '#00d4ff', marginRight: 4 }} />
          {uploadResult.fileName} · {uploadResult.rowCount} 行 ·
          {uploadResult.columns.slice(0, 4).map(c => (
            <Tag key={c} style={{ fontSize: 10, margin: '0 2px' }}>{c}</Tag>
          ))}
          {uploadResult.columns.length > 4 && <span>+{uploadResult.columns.length - 4}</span>}
        </div>
      )}
    </div>
  );
}
