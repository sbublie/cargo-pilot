from input_converter import InputConverter
from env import SHOW_PROMPT
from api_handler import APIHandler

import json
import inquirer

def main():

    if SHOW_PROMPT:
        # Show propt that asks the user for the filename and also checks if the file is existing
        questions = [
            inquirer.Path('file',
                    message="Enter the file name",
                    path_type=inquirer.Path.FILE,
                    exists=True)
        ]
        answers = inquirer.prompt(questions)
        # Convert the file to the internal data model
        data = json.dumps(InputConverter().process_file(answers["file"]))
        # Upload data to the remote instance
        APIHandler().upload_data(data)
    else:
        # TODO: Delete manual option for Prod
        data = json.dumps(InputConverter().process_file("20230706_05Jan.csv"))
        APIHandler().upload_data(data)

if __name__ == "__main__":
    main()
