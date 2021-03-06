'use strict';

const Yaml = require('js-yaml');
const Hoek = require('hoek');

const phaseValidateStructure = require('./lib/phase/structural');
const phaseFlatten = require('./lib/phase/flatten');
const phaseValidateFunctionality = require('./lib/phase/functional');
const phaseGeneratePermutations = require('./lib/phase/permutation');

/**
 * Parses a yaml file
 * @method parseYaml
 * @param  {String}  yaml Raw yaml
 * @return {Promise}      resoves POJO containing yaml data
 */
const parseYaml = yaml => (new Promise(resolve => resolve(Yaml.safeLoad(yaml))));

/**
 * Parse the configuration from a screwdriver.yaml
 * @method configParser
 * @param  {String}   yaml      Contents of screwdriver.yaml
 * @param  {Function} callback  Function to call when done (error, { workflow, jobs })
 */
module.exports = function configParser(yaml) {
    // Convert from YAML to JSON
    return parseYaml(yaml)
        // Basic validation
        .then(phaseValidateStructure)
        // Flatten structures
        .then(phaseFlatten)
        // Functionality validation
        .then(phaseValidateFunctionality)
        // Generate Permutations
        .then(phaseGeneratePermutations)
        // Output in the right format
        .then(doc => ({
            jobs: Hoek.reach(doc, 'jobs'),
            workflow: Hoek.reach(doc, 'workflow')
        }))
        .catch(err => ({
            jobs: {
                main: [{
                    image: 'node:6',
                    commands: [{
                        name: 'config-parse-error',
                        command: `echo "${err}"; exit 1`
                    }],
                    secrets: [],
                    environment: {}
                }]
            },
            workflow: ['main']
        }));
};
