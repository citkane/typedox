import func_projectstructure from './functional.serialiser.projectStructure.spec.mjs';
import func_variables from './functional.serialiser.variables.spec.mjs';
import func from './functional.serialiser.spec.mjs';

const serialiser = {
	functional: {
		projectStructure: func_projectstructure,
		variables: func_variables,
		func,
	},
};

export default serialiser;
