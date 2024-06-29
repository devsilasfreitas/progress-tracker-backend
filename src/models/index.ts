import { Entry } from "./Entry";
import { Target } from "./Target";
import { User } from "./User";
import { UserTarget } from "./UserTarget";
import { VerificationCode } from "./VerificationCode";

Target.hasMany(Entry, { as: 'entries' });
Entry.belongsTo(Target);

User.hasMany(Entry, { as: 'entries'});
Entry.belongsTo(User);

User.belongsToMany(Target, {
    through: UserTarget,
    foreignKey: 'user_id',
    as: 'targets'
});
Target.belongsToMany(User, {
    through: UserTarget,
    foreignKey: 'target_id',
    as: 'users'
});

User.hasMany(VerificationCode, { as: 'verification_codes' });
VerificationCode.belongsTo(User);

export {
    Entry,
    Target,
    User,
    UserTarget,
    VerificationCode
}