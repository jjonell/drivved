module.exports = {
    test: (req, res) => {
        res.send('hej');
    },
    get: (req, res) => {
        res.send('get request, use direct url instead');
    },
    post: (req, res) => {
        console.log(req.files);
        res.send('post');
    }
}