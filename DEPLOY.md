
# 🚀 Deployment & Integration Guide

## 1. Get it Online (GitHub Pages)

Since you have the files ready on your computer:

1.  **Upload to GitHub:**
    *   Create a new repository on GitHub.com.
    *   Upload all your project files (index.html, index.tsx, etc.).
2.  **Activate GitHub Pages:**
    *   Go to your repository **Settings**.
    *   Click **Pages** in the left sidebar.
    *   Under **Build and deployment**, select **Source: Deploy from a branch**.
    *   Select Branch: **main**, Folder: **/(root)**.
    *   Click **Save**.
3.  **Get Your URL:**
    *   After a minute, refresh the page. GitHub will show you your live URL at the top (e.g., `https://yourusername.github.io/sacred-harp`).

---

## 2. Add to Your Website (Iframe)

Once you have your GitHub Pages URL, use this code to embed the app on **Shopify, Wix, Squarespace, WordPress**, or any custom site.

**Copy and paste this HTML code block** into a "Custom HTML" or "Embed" block on your website page:

```html
<iframe 
  src="https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME" 
  style="width: 100%; height: 900px; border: none; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05);" 
  title="Sacred Forest Crystal Harp"
  allow="autoplay; microphone"
></iframe>
```

**Important:** Replace the `src` link (`https://...`) with the actual URL you got from Step 1.

---

## 3. How to Update (The Workflow)

To continue developing while the app is live on your site:

1.  **Ask for changes here** (e.g., "Make the particles pink", "Add a bass note").
2.  **Copy the code updates** provided into your local files.
3.  **Push to GitHub:**
    ```bash
    git add .
    git commit -m "Update app features"
    git push
    ```
4.  **Done!** GitHub Pages will automatically rebuild, and the app on your website will update itself within 1-2 minutes. You **do not** need to change the embed code on your website.
