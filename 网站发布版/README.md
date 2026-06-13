# 安静书数学乐园

这是一个可以直接部署到 Netlify 的静态网页项目。

## 部署方式

1. 把本文件夹内的所有内容上传到 GitHub 仓库根目录。
2. 在 Netlify 里选择从 GitHub 导入项目。
3. Build command 留空。
4. Publish directory 填 `.`。
5. 部署完成后，iPad 可以直接访问 Netlify 给出的地址。

## 文件说明

- `index.html`：网页入口。
- `看图题素材/`：卷子题图片素材。
- `netlify.toml`：Netlify 静态部署配置。

## 后续更新

以后修改 `index.html` 或素材后，推送到 GitHub，Netlify 会自动更新网站。
