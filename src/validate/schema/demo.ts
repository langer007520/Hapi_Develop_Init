import Joi, { AnySchema } from 'joi';
import { EnumDemo, JobDemo, PeopleDemo, PersonDemo, WalletDemo, } from '../interfaces';

export const JobSchema: AnySchema<JobDemo> = Joi.object({
    businessName: Joi.string().required(),
    jobTitle: Joi.string().required()
}).meta({ className: 'JobDemo' });

export const WalletSchema: AnySchema<WalletDemo> = Joi.object({
    usd: Joi.number().required(),
    eur: Joi.number().required()
}).unknown().meta({ className: 'WalletDemo', unknownType: 'number' });

export const PersonSchema: AnySchema<PersonDemo> = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required().description('Last Name'),
    job: JobSchema,
    wallet: WalletSchema
}).meta({ className: 'PersonDemo' }).description('PersonDemo1');

export const EnumDemoSchema: AnySchema<EnumDemo> = Joi.valid('red', 'green', 'blue').meta({ className: 'EnumDemo' })

export const PeopleSchema: AnySchema<PeopleDemo> = Joi.array().items(PersonSchema).required().meta({ className: 'PeopleDemo' }).description('A list of People');
