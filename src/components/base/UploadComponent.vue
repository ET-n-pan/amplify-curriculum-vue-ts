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
                <ui5-file-uploader id="button-only-uploader" hide-input multiple @change="handleFileSelect">
                    <ui5-button icon="upload" tabindex="-1" transparent>Upload</ui5-button>
                </ui5-file-uploader>
            </div>
            <ui5-upload-collection-item
                v-for="file in uploadedFiles"
                :key="file.id"
                :file-name="file.displayName"
                :progress="file.progress || 0"
                :upload-state="file.state"
                @retry="retryUpload(file)"
            >
                <ui5-icon name="document-text" slot="thumbnail"></ui5-icon>
            </ui5-upload-collection-item>
      </ui5-upload-collection>
    </ui5-card>

    <ui5-card v-if="uploadedFiles.length > 0" style="margin-top: 1rem">
    <ui5-list>
      <ui5-li-notification
        v-for="file in uploadedFiles"
        :key="file.id"
        :title-text="file.name"
        :priority="file.state === 'Error' ? 'High' : file.state === 'Complete' ? 'Low' : 'Medium'"
        :state="file.state === 'Error' ? 'Error' : file.state === 'Complete' ? 'Success' : 'Information'"
        show-close
        @close="handleDelete({ detail: { item: { fileName: file.name } } })"
      >
        <ui5-avatar slot="avatar" :color-scheme="file.state === 'Complete' ? 'Accent1' : 'Accent8'" style="margin: 0.5rem;">
          <ui5-icon :name="file.state === 'Complete' ? 'accept' : 'document-text'"></ui5-icon>
        </ui5-avatar>
        
        <span slot="subtitle" style="font-size:large;">{{ file.status }}</span>
        
        <!-- Progress indicator for ongoing uploads/processing -->
        <ui5-progress-indicator 
          v-if="file.state !== 'Complete' && file.state !== 'Error'"
          slot="footnotes"
          style="margin-left: 1.5rem; width: calc(100% - 3rem);"
          :value="file.progress || 0"
          :display-value="`${file.progress || 0}%`"
        />
        
        <!-- Summary list for completed jobs -->
        <div v-if="file.state === 'Complete' && file.summary" slot="footnotes">
          <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.875rem;">
            <li>開始時刻: {{ file.summary.startTime }}</li>
            <li>終了時刻: {{ file.summary.endTime }}</li>
            <li>処理時間: {{ file.summary.duration }}</li>
            <li>処理行数: {{ file.summary.rows }}</li>
          </ul>
        </div>
      </ui5-li-notification>
    </ui5-list>
  </ui5-card>

    <ui5-message-strip 
      v-if="globalStatus"
      :design="messageDesign"
      style="margin-top: 1rem"
      closeable
      @close="globalStatus = ''"
    >
      {{ globalStatus }}
    </ui5-message-strip>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, onMounted } from 'vue';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import '@ui5/webcomponents/dist/Card.js';
import '@ui5/webcomponents/dist/CardHeader.js';
import '@ui5/webcomponents-fiori/dist/UploadCollection.js';
import '@ui5/webcomponents-fiori/dist/UploadCollectionItem.js';
import '@ui5/webcomponents/dist/FileUploader.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/MessageStrip.js';
import '@ui5/webcomponents/dist/List.js';
import "@ui5/webcomponents-icons/dist/AllIcons.js";
import { on } from 'events';

const client = generateClient();
const uploadedFiles = ref([]);
const globalStatus = ref('');
const messageDesign = ref('Information');
const subscriptions = new Map();
const pollingIntervals = new Map();

onMounted(() => {
    let uploadCollection = document.querySelector("ui5-upload-collection");
    uploadCollection.addEventListener("ui5-item-delete", e => {
        console.log("uploadCollection:", uploadCollection);
        uploadCollection.removeChild(e.detail.item);
    });

});

const handleDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files?.length > 0) {
    processFile(files[0]);
  }
};

const handleFileSelect = (event) => {
  const files = event.detail.files;
  if (files?.length > 0) {
    for (const file of files) {
      processFile(file);
    }
  }
};

const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
        globalStatus.value = 'CSVファイルのみアップロード可能です';
        messageDesign.value = 'Warning';
        return;
    }
    // Clear any previous message when starting new upload
    globalStatus.value = '';
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    
    const fileItem = {
        id: timestamp,
        name: file.name,
        fileName: fileName,
        displayName: file.name,
        progress: 0,
        state: 'Uploading',
        status: 'アップロード中...',
        file: file,
        processedBatches: 0,
        totalBatches: 0,
        processedRows: 0,
        successfulOrders: 0,
        failedOrders: 0,
        jobId: null,
        summary: null
    };

    uploadedFiles.value.push(fileItem);

    try {
        const result = await uploadData({
            path: `public/csv-uploads/${fileName}`,
            data: file,
            options: {
                onProgress: ({ transferredBytes, totalBytes }) => {
                    if (fileItem.state === 'Uploading') {
                        fileItem.progress = Math.round((transferredBytes / totalBytes) * 100);
                        fileItem.status = `アップロード中... ${fileItem.progress}%`;
                        // Update display name to show progress
                        fileItem.displayName = `${file.name}`;
                    }
                }
            }
        }).result;

        fileItem.state = 'Ready';
        fileItem.status = `✓ アップロード完了 - 処理待ち...`;
        fileItem.progress = 100;
        fileItem.displayName = file.name;
        
        globalStatus.value = `${file.name} アップロード完了！処理を開始します...`;
        messageDesign.value = 'Success';
        
        // Start polling for job creation
        startJobPolling(fileItem);
        
    } catch (error) {
        fileItem.state = 'Error';
        fileItem.status = `✗ 失敗: ${error.message}`;
        fileItem.displayName = `${file.name} (エラー)`;
        globalStatus.value = `アップロード失敗: ${error.message}`;
        messageDesign.value = 'Error';
    }
};

const pollJobStatus = (fileItem, jobId) => {
    console.log(`Starting polling for job: ${jobId}`);
    
    const pollInterval = setInterval(async () => {
        try {
            const { data: job, errors } = await client.models.ProcessingJob.get({ id: jobId }); 
            console.log('Polled job status:', job);
            
            if (job) {
                // Update all values
                fileItem.processedBatches = job.processedBatches || 0;
                fileItem.totalBatches = job.totalBatches || 0;
                fileItem.successfulOrders = job.successfulOrders || 0;
                fileItem.failedOrders = job.failedOrders || 0;
                fileItem.processedRows = job.processedRows || 0;
                
                // Update progress bar
                if (fileItem.totalBatches > 0) {
                    fileItem.progress = Math.round((fileItem.processedBatches / fileItem.totalBatches) * 100);
                }
                
                // Update display name to show progress
                if (job.status === 'PROCESSING') {
                    fileItem.status = `処理中: ${fileItem.processedBatches}/${fileItem.totalBatches} バッチ`;
                    fileItem.displayName = `${fileItem.name} (${fileItem.progress}%)`;
                    fileItem.state = 'Ready';
                }
                
                // Handle completion
                if (job.status === 'COMPLETED') {
                    clearInterval(pollInterval);
                    pollingIntervals.delete(fileItem.id);
                    
                    // Format times
                    const startTime = new Date(job.startTime);
                    const endTime = new Date(job.endTime);
                    const durationMs = endTime - startTime;
                    const durationSec = Math.round(durationMs / 1000);
                    
                    // Create summary object
                    fileItem.summary = {
                        startTime: startTime.toLocaleString('ja-JP'),
                        endTime: endTime.toLocaleString('ja-JP'),
                        duration: `${durationSec}秒`,
                        rows: `${job.successfulOrders}件成功 / ${job.failedOrders}件失敗`
                    };
                    
                    fileItem.status = '処理完了';
                    fileItem.state = 'Complete';
                    fileItem.progress = 100;
                    
                    // Update global status
                    globalStatus.value = `${fileItem.name} の処理が完了しました！ (${fileItem.successfulOrders}件成功)`;
                    messageDesign.value = 'Success';
                }
                
                if (job.status === 'FAILED') {
                    clearInterval(pollInterval);
                    pollingIntervals.delete(fileItem.id);
                    
                    fileItem.status = `✗ エラー: ${job.errorMessage || '不明なエラー'}`;
                    fileItem.state = 'Error';
                    fileItem.displayName = `${fileItem.name} (エラー)`;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 1000);
    
    pollingIntervals.set(fileItem.id, pollInterval);
};

// Also fix the initial job detection - it's getting ALL jobs, not filtered:
const startJobPolling = (fileItem) => {
    let attempts = 0;
    const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
            console.log(`Polling attempt ${attempts} for file: ${fileItem.fileName}`);
            
            // FIX: Filter by fileName to get the right job!
            const { data: jobs } = await client.models.ProcessingJob.list({
                filter: {
                    fileName: { contains: fileItem.fileName }
                }
            });
            
            if (jobs && jobs.length > 0) {
                clearInterval(pollInterval);
                pollingIntervals.delete(fileItem.id);
                
                const job = jobs[0];
                console.log('Job found:', job);
                
                // Set initial values
                fileItem.jobId = job.id;
                fileItem.totalBatches = job.totalBatches || 0;
                fileItem.processedBatches = job.processedBatches || 0;
                fileItem.processedRows = job.processedRows || 0;
                fileItem.successfulOrders = job.successfulOrders || 0;
                fileItem.failedOrders = job.failedOrders || 0;
                
                // Check if already complete
                if (job.status === 'COMPLETED') {
                    fileItem.state = 'Complete';
                    fileItem.progress = 100;
                    
                    const startTime = new Date(job.startTime);
                    const endTime = new Date(job.endTime);
                    const durationMs = endTime - startTime;
                    const durationSec = Math.round(durationMs / 1000);
                    fileItem.summary = {
                        startTime: startTime.toLocaleString('ja-JP'),
                        endTime: endTime.toLocaleString('ja-JP'),
                        duration: `${durationSec}秒`,
                        rows: `${job.successfulOrders}件成功 / ${job.failedOrders}件失敗`
                    };

                    fileItem.status = '✓ 処理完了';
                    globalStatus.value = `${fileItem.name} の処理が完了しました！`;
                    messageDesign.value = 'Success';
                } else {
                    // Start status polling only if not complete
                    fileItem.status = `処理中: ${fileItem.processedBatches}/${fileItem.totalBatches} バッチ`;
                    pollJobStatus(fileItem, job.id);
                }
            }
            
            if (attempts > 60) {
                clearInterval(pollInterval);
                pollingIntervals.delete(fileItem.id);
                fileItem.status = '処理開始待ち (タイムアウト)';
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 1000);
    
    pollingIntervals.set(fileItem.id, pollInterval);
};

const retryUpload = (file) => {
    const index = uploadedFiles.value.indexOf(file);
    if (index > -1) {
        // Clean up any existing subscriptions
        const subscription = subscriptions.get(file.id);
        subscription?.unsubscribe();
        subscriptions.delete(file.id);
        
        uploadedFiles.value.splice(index, 1);
        processFile(file.file);
    }
};

const handleSelectionChange = (event) => {
    // Handle selection if needed
};

// Clean up on component unmount
onUnmounted(() => {
    subscriptions.forEach(sub => sub.unsubscribe());
    subscriptions.clear();
    
    pollingIntervals.forEach(interval => clearInterval(interval));
    pollingIntervals.clear();
});
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