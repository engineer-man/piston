const express = require('express');
const { execute } = require('../../lxc/execute.js');
const { languages } = require('./languages');
const { checkSchema, validationResult } = require('express-validator');

const PORT = 2000;

const app = express();
app.use(express.json());

app.post(
    '/execute',
    checkSchema({
        language: {
            in: 'body',
            notEmpty: {
                errorMessage: 'No language supplied',
            },
            isString: {
                errorMessage: 'Supplied language is not a string',
            },
            custom: {
                options: value => value && languages.find(language => language.aliases.includes(value.toLowerCase())),
                errorMessage: 'Supplied language is not supported by Piston',
            },
        },
        source: {
            in: 'body',
            notEmpty: {
                errorMessage: 'No source supplied',
            },
            isString: {
                errorMessage: 'Supplied source is not a string',
            },
        },
        args: {
            in: 'body',
            optional: true,
            isArray: {
                errorMessage: 'Supplied args is not an array',
            },
        },
        stdin: {
            in: 'body',
            optional: true,
            isString: {
                errorMessage: 'Supplied stdin is not a string',
            },
        }
    }),
    async (req, res) => {
        const errors = validationResult(req).array();

        if (errors.length === 0) {
            const language = languages.find(language =>
                language.aliases.includes(req.body.language.toLowerCase())
            );

            const { stdout, stderr, output, ran } = await execute(language, req.body.source, req.body.stdin, req.body.args);

            res.status(200).json({
                ran,
                language: language.name,
                version: language.version,
                stdout,
                stderr,
                output,
            });
        } else {
            res.status(400).json({
                message: errors[0].msg,
            });
        }
    },
);

app.get('/versions', (_, res) => res.json(languages));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
