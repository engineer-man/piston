const express = require('express');
const { execute } = require('./execute');
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
                errorMessage: 'Supply a language field',
            },
            isString: {
                errorMessage: 'Supplied language is not a string',
            },
            custom: {
                options: value => languages.find(language => language.name === value?.toLowerCase()),
                errorMessage: 'Supplied language is not supported by Piston',
            },
        },
        source: {
            in: 'body',
            notEmpty: {
                errorMessage: 'Supply a source field',
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
        }
    }),
    (req, res) => {
        const errors = validationResult(req).array();

        if (errors.length === 0) {
            const language = languages.find(language =>
                language.aliases.includes(req.body.language.toLowerCase())
            );

            execute(res, language, req.body);
        } else {
            res.status(400).json({
                message: errors[0].msg,
            });
        }
    },
);

app.get('/versions', (_, res) => res.json(languages));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
