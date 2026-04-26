import axios from 'axios';

// 生产环境使用 Netlify 域名，本地开发时注释掉下面这行，改用 localhost
export default axios.create({
  baseURL: 'https://astounding-jalebi-d6bb33.netlify.app/api'
});
