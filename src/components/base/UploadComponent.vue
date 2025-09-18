<template>
  <div class="upload-container">
    <ui5-card>
        <ui5-upload-collection
            id="uploadCollection"
            no-data-text="ドラッグ＆ドロップしてアップロード"
            @drop="handleDrop"
            @item-delete="handleDelete"
            @selection-change="handleSelectionChange"
        >
            <div slot="header" class="header">
                <ui5-title>CSV Upload</ui5-title>
                <div class="spacer"></div>
                <ui5-file-uploader id="button-only-uploader" hide-input multiple >
                    <ui5-button icon="sap-icon://upload" tabindex="-1" transparent>Upload</ui5-button>
                </ui5-file-uploader>
            </div>
            <ui5-upload-collection-item
                v-for="file in uploadedFiles"
                :key="file.name"
                :file-name="file.name"
                :progress="file.progress"
                :upload-state="file.state"
                @retry="retryUpload(file)"
            >
                <ui5-icon name="document-text" slot="thumbnail"></ui5-icon>
                <ui5-label slot="description">{{ file.status }}</ui5-label>
            </ui5-upload-collection-item>
      </ui5-upload-collection>
    </ui5-card>

    <ui5-message-strip 
      v-if="globalStatus"
      :design="messageDesign"
      style="margin-top: 1rem"
      closeable
    >
      {{ globalStatus }}
    </ui5-message-strip>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadData } from 'aws-amplify/storage';
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents-fiori/dist/UploadCollection.js';
import '@ui5/webcomponents-fiori/dist/UploadCollectionItem.js';
import '@ui5/webcomponents/dist/FileUploader.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/MessageStrip.js';
import "@ui5/webcomponents-icons/dist/AllIcons.js";
const uploadedFiles = ref([]);
const globalStatus = ref('');
const messageDesign = ref('Information');

const handleDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files?.length > 0) {
    processFile(files[0]);
  }
};

const handleFileSelect = (event) => {
  const file = event.detail.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
        globalStatus.value = 'CSVファイルのみアップロード可能です';
        messageDesign.value = 'Warning';
        return;
    }

    const fileItem = {
        name: file.name,
        progress: 0,
        state: 'Uploading',
        status: 'Uploading to S3...',
        file: file
    };

    uploadedFiles.value.push(fileItem);

    try {
        const result = await uploadData({
        path: `public/csv-uploads/${file.name}`,
        data: file,
        options: {
            onProgress: ({ transferredBytes, totalBytes }) => {
            fileItem.progress = Math.round((transferredBytes / totalBytes) * 100);
            fileItem.status = `Uploading... ${fileItem.progress}%`;
            }
        }
        }).result;

        fileItem.state = 'Complete';
        fileItem.status = `✓ Uploaded - Processing ${file.size} bytes`;
        fileItem.progress = 100;
        
        globalStatus.value = `File uploaded! Lambda will process ${file.name}`;
        messageDesign.value = 'Success';
        
        // Poll for job status (connect to DynamoDB tracking)
        checkJobStatus(file.name);
        
    } catch (error) {
        fileItem.state = 'Error';
        fileItem.status = `✗ Failed: ${error.message}`;
        globalStatus.value = `Upload failed: ${error.message}`;
        messageDesign.value = 'Error';
    }
};

const handleDelete = (event) => {
    const fileName = event.detail.item.fileName;
    uploadedFiles.value = uploadedFiles.value.filter(f => f.name !== fileName);
};

const retryUpload = (file) => {
    const index = uploadedFiles.value.indexOf(file);
    if (index > -1) {
        uploadedFiles.value.splice(index, 1);
        processFile(file.file);
    }
};

const checkJobStatus = async (fileName) => {
    // Poll your API Gateway/AppSync endpoint for job status
    // This would connect to DynamoDB tracking table
    globalStatus.value = 'Processing CSV... Check console for batch progress';
    messageDesign.value = 'Information';
};
</script>

<style scoped>
.header {
    display: flex;
    align-items: center;
    overflow: hidden;
    flex-wrap: wrap;
}

.spacer {
    flex: 1 1 auto;
}

.upload-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
}

/* Enable drag & drop visual feedback */
#uploadCollection {
    min-height: 200px;
    border: 2px dashed transparent;
    transition: all 0.3s;
}

#uploadCollection:hover {
    border-color: var(--sapBrandColor);
    background-color: var(--sapBackgroundColor);
}
</style>