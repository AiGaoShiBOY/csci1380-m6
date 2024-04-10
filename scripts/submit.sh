

cd "$(dirname "$0")/.." || exit


log() 
{
    if [ "$2" = "-n" ]; then
	printf "[submit] %s" "$1"
    else
	printf "[submit] %s\n" "$1"
    fi
}

[[ ! -x "$(command -v zip)" ]] && log "zip not found, please install it" && exit 1
[[ ! -x "$(command -v git)" ]] && log "git not found, please install it" && exit 1

# Check if we are in a git repository
git ls-files > /dev/null || exit 1

cd "$(dirname "$0")/.." || exit

SUBMISSION_FOLDER="submission"
ROOT_FOLDER=javascript
SRC_FOLDER="$ROOT_FOLDER/src/main"
TARGET_FOLDER="$SUBMISSION_FOLDER/$SRC_FOLDER"

log "creating submission..."

[ -d $TARGET_FOLDER ] && rm -r $TARGET_FOLDER
mkdir -p "$TARGET_FOLDER"

git ls-files | while IFS='' read -r file
do 
    mkdir -p $TARGET_FOLDER/"$(dirname "$file")"
    cp "$file" $TARGET_FOLDER/"$(dirname "$file")"
done

log "copied files to submission folder"

cd $SUBMISSION_FOLDER || exit 1

zip ../submission.zip -r $ROOT_FOLDER > /dev/null

log "created submission: submission.zip"

cd .. || exit 1

[[ -d submission ]] && rm -r submission

log "removing the submission folder..."

[[ -f submission.zip ]] || exit 1

log "you can now upload it to autograder!"
