const remoteStorage = sftpStorage({
    sftp: {
        host: 'https://icedrive.net/API/Internal/V1/?request=geo-filserver-list&sess=1',
        username: 'tinhntgcd18753@fpt.edu.vn',
        password: 'zdz6Vk6fKJ$hrgj'
    }
});

module.exports = remoteStorage;