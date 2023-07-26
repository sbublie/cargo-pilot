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
                    exists=True),
            inquirer.Path('source',
                    message="Enter the name of the source",
                    path_type=inquirer.Path.TEXT,
                    exists=True)
        ]
        answers = inquirer.prompt(questions)
        # Convert the file to the internal data model
        data = json.dumps(InputConverter().process_file(filename=answers["file"], source=answers["source"]))
        # Upload data to the remote instance
        APIHandler().upload_data(data)
    else:
        # TODO: Delete manual option for Prod
        data = json.dumps(InputConverter().process_file(filename="20230706_05Jan.csv", source="Transics"))
        APIHandler().upload_data(data)

if __name__ == "__main__":
    main()
