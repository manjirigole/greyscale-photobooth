const uploadedImages = JSON.parse(
  localStorage.getItem("croppedImages") || "{}"
);

function goToFilteredPage() {
  const storedImages = JSON.parse(
    localStorage.getItem("croppedImages") || "{}"
  );

  if (Object.keys(storedImages).length === 3) {
    // Redirect to the final photobooth strip display page
    window.location.href = "strip.html"; // Change filename if needed
  } else {
    alert("Please upload and apply crop to all 3 images before proceeding.");
  }
}
function showCustomAlert(message, type = "success", duration = 3000) {
  const alertBox = document.getElementById("custom-alert");
  alertBox.textContent = message;
  alertBox.className = `custom-alert show ${type}`;

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, duration);
}
function generateFinalStrip() {
  const caption = document.getElementById("caption").value.trim();
  const bgColor = document.getElementById("bgColor").value.trim();
  const captionColor =
    document.getElementById("captionColor")?.value.trim() || "#ffffff"; // default to white
  const date = document.getElementById("photoDate").value.trim();

  const croppedImages = JSON.parse(
    localStorage.getItem("croppedImages") || "{}"
  );

  if (Object.keys(croppedImages).length !== 3) {
    showCustomAlert("Please upload and crop exactly 3 images.");
    return;
  }

  const canvasHeight = 200 * 3 + 80;
  const canvas = new fabric.Canvas(null, {
    width: 200,
    height: canvasHeight,
    backgroundColor: bgColor,
  });

  const sortedKeys = Object.keys(croppedImages).sort();
  let loadedCount = 0;

  sortedKeys.forEach((key, index) => {
    fabric.Image.fromURL(croppedImages[key], function (img) {
      img.scaleToWidth(200);
      img.scaleToHeight(200);
      img.set({
        top: index * 200,
        left: 0,
        selectable: false,
        evented: false,
      });

      img.filters.push(new fabric.Image.filters.Grayscale());
      img.applyFilters();
      canvas.add(img);
      loadedCount++;

      if (loadedCount === sortedKeys.length) {
        const captionText = new fabric.Text(caption, {
          fontSize: 16,
          fill: captionColor,
          fontFamily: "Homemade Apple",
          top: canvas.height - 60,
          left: 100,
          originX: "center",
          selectable: false,
          backgroundColor: bgColor,
        });

        const dateText = new fabric.Text(date, {
          fontSize: 14,
          fill: captionColor,
          fontFamily: "Homemade Apple",
          top: canvas.height - 30,
          left: 100,
          originX: "center",
          selectable: false,
          backgroundColor: bgColor,
        });

        canvas.add(captionText);
        canvas.add(dateText);

        const finalData = canvas.toDataURL({ format: "png" });
        localStorage.setItem("finalStrip", finalData);
        localStorage.setItem("stripBgColor", bgColor);

        showCustomAlert("Photobooth strip saved! Redirecting...");
        window.location.href = "filtered.html";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const bgColorInput = document.getElementById("bgColor");
  const stripWrapper = document.querySelector(".strip-wrapper");
  const savedBgColor = localStorage.getItem("stripBgColor") || "#ffffff";

  // Initialize the strip-wrapper background color from bgColor input
  if (stripWrapper) {
    stripWrapper.style.backgroundColor = savedBgColor;
  }

  const canvasEl = document.getElementById("photobooth-strip");
  const msg = document.getElementById("no-img-msg");
  const finalData = localStorage.getItem("finalStrip");

  if (canvasEl && msg) {
    if (!finalData) {
      msg.style.display = "block";
      return;
    } else {
      msg.style.display = "none";
    }

    const canvas = new fabric.Canvas("photobooth-strip");
    fabric.Image.fromURL(finalData, function (img) {
      canvas.setWidth(img.width);
      canvas.setHeight(img.height);
      canvas.add(img);
      img.set({ selectable: false, evented: false });
    });
  }

  // Cropping & Upload logic
  const inputs = document.querySelectorAll('input[type="file"]');
  inputs.forEach((input) => {
    const wrapper = input.closest(".upload-wrapper");
    const container = wrapper.querySelector(".draggable-container");
    const applyBtn = wrapper.querySelector(".apply-btn");

    container.addEventListener("click", (e) => {
      if (e.target.tagName !== "IMG") input.click();
    });

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        let img = container.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          img.className = "draggable-img";
          container.appendChild(img);
        }
        img.src = e.target.result;
        img.onload = () => {
          let scale = 200 / img.naturalHeight;
          img.style.height = "200px";
          img.style.width = `${img.naturalWidth * scale}px`;
          img.style.left = "0px";
          img.style.top = "0px";
          img.dataset.scale = scale;
          img.dataset.zoom = "1";
        };

        // Dragging logic
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        img.onmousedown = (e) => {
          e.preventDefault();
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          initialLeft = parseInt(img.style.left) || 0;
          initialTop = parseInt(img.style.top) || 0;

          document.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const parent = img.parentElement;
            const newLeft = Math.max(
              Math.min(initialLeft + dx, 0),
              parent.clientWidth - img.clientWidth
            );
            const newTop = Math.max(
              Math.min(initialTop + dy, 0),
              parent.clientHeight - img.clientHeight
            );
            img.style.left = `${newLeft}px`;
            img.style.top = `${newTop}px`;
          };

          document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
          };
        };

        // Zoom logic
        container.addEventListener("wheel", (e) => {
          e.preventDefault();
          const zoomStep = 0.1;
          let zoom = parseFloat(img.dataset.zoom || "1");

          if (e.deltaY < 0) zoom += zoomStep;
          else zoom = Math.max(0.5, zoom - zoomStep);

          const baseScale = parseFloat(img.dataset.scale);
          const newWidth = img.naturalWidth * baseScale * zoom;
          const newHeight = img.naturalHeight * baseScale * zoom;

          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;

          const parent = img.parentElement;
          const left = parseInt(img.style.left) || 0;
          const top = parseInt(img.style.top) || 0;
          const maxLeft = parent.clientWidth - newWidth;
          const maxTop = parent.clientHeight - newHeight;

          img.style.left = `${Math.min(0, Math.max(left, maxLeft))}px`;
          img.style.top = `${Math.min(0, Math.max(top, maxTop))}px`;

          img.dataset.zoom = zoom.toString();
        });

        // Crop button click handler
        applyBtn.onclick = () => {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 200;
          tempCanvas.height = 200;
          const ctx = tempCanvas.getContext("2d");

          const scale = img.naturalHeight / 200;
          const zoom = parseFloat(img.dataset.zoom || "1");
          const baseScale = parseFloat(img.dataset.scale);
          const effectiveScale = baseScale * zoom;

          const sx = -parseInt(img.style.left) / effectiveScale;
          const sy = -parseInt(img.style.top) / effectiveScale;
          const sw = 200 / effectiveScale;
          const sh = 200 / effectiveScale;

          const imageObj = new Image();
          imageObj.onload = () => {
            ctx.drawImage(imageObj, sx, sy, sw, sh, 0, 0, 200, 200);
            const finalData = tempCanvas.toDataURL("image/png");

            uploadedImages[input.id] = finalData;
            localStorage.setItem(
              "croppedImages",
              JSON.stringify(uploadedImages)
            );
            showCustomAlert(`Crop applied for ${input.id}`);
          };
          imageObj.src = img.src;
        };
      };
      reader.readAsDataURL(file);
    });
  });
  const downloadBtn = document.getElementById("download-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const finalData = localStorage.getItem("finalStrip");
      const bgColor = localStorage.getItem("stripBgColor") || "#ffffff";

      if (!finalData) {
        showCustomAlert("No strip to download");
        return;
      }

      const image = new Image();
      image.onload = function () {
        const padding = 20; // space on left and right
        const canvasWidth = image.width + padding * 2;
        const canvasHeight = image.height + padding * 2;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;

        const ctx = tempCanvas.getContext("2d");

        // Fill with background color
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the strip in the center
        ctx.drawImage(image, padding, padding);

        const finalImage = tempCanvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = finalImage;
        link.download = "greyscale_photobooth.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      image.src = finalData;
    });
  }
});
