
var mediaRecorder = null;
var chunks = [];
chrome.runtime.onMessage.addListener((message) => {
  if (message.name == 'startRecording') {
    startRecording(message.body.currentTab.id)
  }
  if (message.name == 'stopRecording') {
    mediaRecorder.stop()
  }
});

function startRecording(currentTabId){
  // Prompt user to choose screen or window
  chrome.desktopCapture.chooseDesktopMedia(
    ['screen', 'window'],
    function (streamId) {
      if (streamId == null) {
        return;
      }

      // Once user has chosen screen or window, create a stream from it and start recording
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId,
          }
        }
      }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);

        chunks = [];

        mediaRecorder.ondataavailable = function(e) {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = async function(e) {
          const blobFile = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blobFile)
          // Stop all tracks of stream
          stream.getTracks().forEach(track => track.stop());

          const downloadLink = document.createElement('a');
          // Set the anchor's attributes
          downloadLink.href = url;
          downloadLink.download = 'demo.mp4'; // Specify the desired filename

          // Programmatically trigger a click event on the anchor to initiate the download
          downloadLink.click();
          window.close()
        }

        mediaRecorder.start();
      }).finally(async () => {
        // After all setup, focus on previous tab (where the recording was requested)
        await chrome.tabs.update(currentTabId, { active: true, selected: true })
      });
    })
}