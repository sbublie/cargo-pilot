from input_converter import InputConverter
from env import SHOW_PROMPT
from api_handler import APIHandler

import json
import inquirer

def main():

    if SHOW_PROMPT:
        # Show propt that asks the user for the filename and also checks if the file is existing
        questions = [
            inquirer.List(
                "instance",
                message="Do you want to upload to a local or online instance?",
                choices=["Local", "Online"],
            ),
            inquirer.List(
                "data_type",
                message="What type of data do you want to upload?",
                choices=["Trips", "Offerings"],
            ),
            inquirer.List(
                "source",
                message="What is the source of the data?",
                choices=["Transics", "DB"],
            ),
            inquirer.Path('file',
                          message="Enter the file name",
                          path_type=inquirer.Path.FILE,
                          exists=True),
        ]
        answers = inquirer.prompt(questions)

        processed_data = InputConverter().convert_data_from_file(filename=answers["file"], source=answers["source"], data_type=answers["data_type"])

        if processed_data:
            data = json.dumps(processed_data)
            APIHandler().upload_data(data=data, instance=answers["instance"], data_type=answers["data_type"])




if __name__ == "__main__":
    main()
