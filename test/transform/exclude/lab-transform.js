module.exports = [
    {
        ext: '.new',
        transform: function (content, filename) {


            if (Buffer.isBuffer(content)) {
                content = content.toString();
            }

            return content.replace('!NOCOMPILE!', 'value = value ').replace('!Test.method(5)!', 'Test.method(1)');
        }
    }
];
